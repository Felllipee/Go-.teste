
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Search, 
  Bell, 
  ChevronDown,
  Sparkles,
  ChevronRight,
  Zap,
  Play,
  TrendingUp
} from 'lucide-react';
import { AppState, ShortLink, UserProfile } from './types.ts';
import { suggestAlias, analyzeLinkMetadata } from './services/geminiService.ts';

const PROFILES: (UserProfile & { color: string })[] = [
  { id: '1', name: 'Naruto Uzumaki', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Naruto&backgroundColor=f59e0b', color: '#f59e0b' },
  { id: '2', name: 'Goku (Kakarot)', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Goku&backgroundColor=ea580c', color: '#ea580c' },
  { id: '3', name: 'Sasuke Uchiha', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sasuke&backgroundColor=1e3a8a', color: '#1e3a8a' },
  { id: '4', name: 'Vegeta Prince', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Vegeta&backgroundColor=2563eb', color: '#2563eb' },
  { id: '5', name: 'Monkey D. Luffy', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luffy&backgroundColor=dc2626', color: '#dc2626' },
];

const FastShortsPro: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppState>(AppState.PROFILES);
  const [activeProfile, setActiveProfile] = useState<typeof PROFILES[0] | null>(null);
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedAliases, setSuggestedAliases] = useState<string[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [redirecting, setRedirecting] = useState<{title: string, color: string} | null>(null);

  useEffect(() => {
    // Detecta se viemos de um link encurtado via 404.html
    const params = new URLSearchParams(window.location.search);
    let code = params.get('c');
    
    if (code) {
      const cleanCode = code.replace(/\/$/, '').split('/').pop() || '';
      const saved = localStorage.getItem('fastshorts_pro_links');
      if (saved) {
        const linksList: ShortLink[] = JSON.parse(saved);
        const link = linksList.find(l => l.shortCode === cleanCode || l.alias === cleanCode);
        
        if (link) {
          setRedirecting({ 
            title: link.title, 
            color: PROFILES[Math.floor(Math.random() * PROFILES.length)].color 
          });
          
          const updatedLinks = linksList.map(l => 
            l.id === link.id ? { ...l, clicks: l.clicks + 1 } : l
          );
          localStorage.setItem('fastshorts_pro_links', JSON.stringify(updatedLinks));
          
          setTimeout(() => { 
            window.location.href = link.originalUrl; 
          }, 1500);
          return;
        }
      }
      // Se não achar link, limpa a URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('fastshorts_pro_links');
    if (saved) {
      try {
        setLinks(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar links", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fastshorts_pro_links', JSON.stringify(links));
  }, [links]);

  const handleProfileSelect = (profile: typeof PROFILES[0]) => {
    setActiveProfile(profile);
    setCurrentPage(AppState.HOME);
    document.body.style.overflow = 'auto';
  };

  const createProLink = async () => {
    if (!urlInput) return;
    setIsProcessing(true);
    try {
      const metadata = await analyzeLinkMetadata(urlInput);
      const shortCode = Math.random().toString(36).substring(2, 8);
      
      const newLink: ShortLink = {
        id: Date.now().toString(),
        originalUrl: urlInput,
        shortCode,
        alias: aliasInput || undefined,
        createdAt: Date.now(),
        clicks: 0, 
        title: metadata.title,
        category: metadata.category,
        posterUrl: `https://picsum.photos/seed/${Math.random()}/600/900`,
        history: []
      };

      setLinks(prev => [newLink, ...prev]);
      setUrlInput('');
      setAliasInput('');
      setSuggestedAliases([]);
      setCurrentPage(AppState.CATALOG);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyLink = (code: string) => {
    const url = new URL(window.location.href);
    const basePath = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
    const shortUrl = `${url.origin}${basePath}${code}`;
    
    // Método de cópia compatível
    const textArea = document.createElement("textarea");
    textArea.value = shortUrl;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert("🎬 Link copiado para o catálogo!");
    } catch (err) {
      alert("Copie manualmente: " + shortUrl);
    }
    document.body.removeChild(textArea);
  };

  const themeColor = activeProfile?.color || '#E50914';

  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-8 text-center font-roboto">
        <div className="text-7xl font-black mb-12 italic tracking-tighter animate-pulse" style={{ color: redirecting.color }}>fastShorts</div>
        <div className="relative w-72 h-1 bg-gray-800 rounded-full overflow-hidden mb-8">
           <div className="absolute inset-0 animate-[loading_1.5s_linear_infinite]" style={{ backgroundColor: redirecting.color }}></div>
        </div>
        <h1 className="text-2xl font-black mb-2 uppercase tracking-[0.3em] italic">Iniciando Episódio...</h1>
        <p className="text-gray-400 text-lg">Título: <span className="text-white font-bold">{redirecting.title}</span></p>
        <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
      </div>
    );
  }

  if (currentPage === AppState.PROFILES) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-4">
        <div className="text-[#E50914] text-6xl font-black mb-16 tracking-tighter italic drop-shadow-2xl">fastShorts</div>
        <h1 className="text-3xl md:text-5xl text-white font-medium mb-12 text-center">Quem vai encurtar hoje?</h1>
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 max-w-5xl">
          {PROFILES.map(p => (
            <button key={p.id} onClick={() => handleProfileSelect(p)} className="group flex flex-col items-center gap-4 transition-transform active:scale-95">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-md overflow-hidden border-4 border-transparent group-hover:border-white transition-all duration-300 shadow-2xl relative" style={{ backgroundColor: p.color }}>
                <img src={p.avatar} className="w-full h-full object-cover bg-black/20" alt={p.name} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
              </div>
              <span className="text-gray-400 text-xl group-hover:text-white font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 px-4 md:px-12 py-4 flex items-center justify-between ${scrolled ? 'bg-[#141414] shadow-2xl' : 'bg-gradient-to-b from-black/90 to-transparent'}`}>
        <div className="flex items-center gap-10">
          <div className="text-3xl font-black italic tracking-tighter cursor-pointer" style={{ color: themeColor }} onClick={() => setCurrentPage(AppState.HOME)}>fastShorts</div>
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => setCurrentPage(AppState.HOME)} className={currentPage === AppState.HOME ? 'text-white' : 'text-gray-400 hover:text-gray-200'}>Início</button>
            <button onClick={() => setCurrentPage(AppState.CATALOG)} className={currentPage === AppState.CATALOG ? 'text-white' : 'text-gray-400 hover:text-gray-200'}>Catálogo</button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <img src={activeProfile?.avatar} className="w-8 h-8 rounded shadow-md" style={{ backgroundColor: themeColor }} alt="avatar" />
        </div>
      </nav>

      {currentPage === AppState.HOME && (
        <div className="relative pt-20">
          <div className="relative h-[80vh] w-full flex items-center px-4 md:px-12 overflow-hidden">
             <div className="absolute inset-0">
                <img src={`https://picsum.photos/seed/${activeProfile?.id}/1920/1080`} className="w-full h-full object-cover grayscale-[0.2]" alt="Billboard" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
             </div>
             
             <div className="relative z-10 max-w-3xl">
                <h1 className="text-5xl md:text-8xl font-black mb-6 uppercase tracking-tighter leading-none italic drop-shadow-2xl">
                   {activeProfile?.name.split(' ')[0]} <br /> <span style={{ color: themeColor }}>PRODUÇÕES</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-lg font-medium drop-shadow-lg">
                  Encurte seus links com a precisão de um ninja e o visual de um original Netflix.
                </p>
                
                <div className="bg-black/60 p-6 md:p-8 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl flex flex-col gap-6">
                   <div className="flex flex-col md:flex-row gap-4">
                      <input 
                        type="text" 
                        placeholder="Cole o link original aqui..."
                        className="flex-1 bg-black/60 border-2 border-white/10 rounded-lg py-4 px-6 text-lg text-white focus:outline-none focus:border-white transition-all shadow-inner"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                      />
                      <button 
                        onClick={createProLink}
                        disabled={isProcessing || !urlInput}
                        className="bg-white text-black px-12 py-4 rounded-lg font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Play className="fill-current w-6 h-6" /> LANÇAR
                      </button>
                   </div>
                   <div className="flex flex-col md:flex-row items-center gap-6">
                      <input 
                        type="text" 
                        placeholder="Nome personalizado (ex: meu-play)"
                        className="w-full md:w-64 bg-black/60 border border-gray-700 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-white"
                        value={aliasInput}
                        onChange={(e) => setAliasInput(e.target.value)}
                      />
                      <button onClick={async () => {
                         if(!urlInput) return;
                         setIsProcessing(true);
                         const s = await suggestAlias(urlInput);
                         setSuggestedAliases(s);
                         setIsProcessing(false);
                      }} className="text-gray-400 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all">
                         <Sparkles className="w-4 h-4" style={{ color: themeColor }} /> Magia da IA
                      </button>
                   </div>
                   {suggestedAliases.length > 0 && (
                     <div className="flex flex-wrap gap-2">
                        {suggestedAliases.map(s => (
                          <button key={s} onClick={() => setAliasInput(s)} className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase hover:bg-white/20 transition-colors">
                            {s}
                          </button>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          </div>
          
          <div className="px-4 md:px-12 -mt-10 relative z-20 pb-20">
             <h2 className="text-2xl font-black mb-6 italic tracking-tight">LANÇAMENTOS RECENTES</h2>
             <div className="flex gap-4 overflow-x-auto pb-10 scrollbar-hide">
                {links.map(link => (
                  <div key={link.id} onClick={() => setCurrentPage(AppState.CATALOG)} className="flex-none w-48 md:w-64 aspect-[2/3] rounded-lg overflow-hidden relative cursor-pointer group hover:scale-105 transition-all shadow-2xl">
                    <img src={link.posterUrl} className="w-full h-full object-cover" alt="Poster" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                    <div className="absolute inset-0 p-5 flex flex-col justify-end">
                       <p className="font-black uppercase text-base italic truncate tracking-tighter">{link.title}</p>
                       <p className="text-[10px] font-bold" style={{ color: themeColor }}>/{link.alias || link.shortCode}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {currentPage === AppState.CATALOG && (
        <div className="pt-28 px-4 md:px-12 min-h-screen">
          <h2 className="text-4xl md:text-5xl font-black italic mb-12 tracking-tighter">GERENCIAR CATÁLOGO</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
             {links.map(link => (
               <div key={link.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 group shadow-2xl flex flex-col">
                  <div className="aspect-video relative overflow-hidden">
                    <img src={`https://picsum.photos/seed/${link.id}/600/340`} className="w-full h-full object-cover opacity-60" alt="Thumb" />
                    <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70">
                       <button onClick={() => copyLink(link.alias || link.shortCode)} className="bg-white text-black p-4 rounded-full hover:scale-110 transition-transform"><Copy className="w-6 h-6" /></button>
                       <button onClick={() => { if(confirm("Apagar título?")) setLinks(prev => prev.filter(l => l.id !== link.id)) }} className="bg-red-600 text-white p-4 rounded-full hover:scale-110 transition-transform"><Trash2 className="w-6 h-6" /></button>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-black uppercase italic text-xl truncate tracking-tighter">{link.title}</h3>
                        <p className="text-xs font-bold mb-4" style={{ color: themeColor }}>/{link.alias || link.shortCode}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">VISUALIZAÇÕES: {link.clicks}</span>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
               </div>
             ))}
          </div>
          {links.length === 0 && (
            <div className="text-center py-40">
               <p className="text-gray-700 font-black text-2xl italic uppercase opacity-20">Nenhum título em exibição</p>
               <button onClick={() => setCurrentPage(AppState.HOME)} className="mt-4 text-[#E50914] font-bold hover:underline">Adicionar meu primeiro link</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FastShortsPro;
