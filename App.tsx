
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Search, 
  Bell, 
  ChevronDown,
  Sparkles,
  Play,
  Info,
  Check,
  ExternalLink
} from 'lucide-react';
import { AppState, ShortLink, UserProfile } from './types.ts';
import { suggestAlias, analyzeLinkMetadata } from './services/geminiService.ts';

const PROFILES: (UserProfile & { color: string })[] = [
  { id: '1', name: 'Admin Principal', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=f59e0b', color: '#f59e0b' },
  { id: '2', name: 'Desenvolvedor', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Coding&backgroundColor=ea580c', color: '#ea580c' },
  { id: '3', name: 'Visitante', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Guest&backgroundColor=1e3a8a', color: '#1e3a8a' },
];

const FastShortsPro: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppState>(AppState.PROFILES);
  const [activeProfile, setActiveProfile] = useState<typeof PROFILES[0] | null>(null);
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState<{title: string} | null>(null);

  // Lógica de Redirecionamento
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('c');
    
    if (code) {
      const cleanCode = code.replace(/\/$/, '').split('/').pop() || '';
      const saved = localStorage.getItem('fastshorts_links_v2');
      if (saved) {
        const linksList: ShortLink[] = JSON.parse(saved);
        const link = linksList.find(l => l.shortCode === cleanCode || l.alias === cleanCode);
        
        if (link) {
          setRedirecting({ title: link.title });
          
          // Incrementa cliques
          const updatedLinks = linksList.map(l => 
            l.id === link.id ? { ...l, clicks: l.clicks + 1 } : l
          );
          localStorage.setItem('fastshorts_links_v2', JSON.stringify(updatedLinks));
          
          setTimeout(() => { 
            window.location.href = link.originalUrl; 
          }, 1800);
          return;
        }
      }
      // Se não achar nada, limpa a URL para o app carregar normal
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('fastshorts_links_v2');
    if (saved) setLinks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('fastshorts_links_v2', JSON.stringify(links));
  }, [links]);

  const handleProfileSelect = (profile: typeof PROFILES[0]) => {
    setActiveProfile(profile);
    setCurrentPage(AppState.HOME);
    document.body.style.overflow = 'auto';
  };

  const createLink = async () => {
    if (!urlInput) return;
    setIsProcessing(true);
    try {
      const meta = await analyzeLinkMetadata(urlInput);
      const shortCode = Math.random().toString(36).substring(2, 8);
      
      const newLink: ShortLink = {
        id: Date.now().toString(),
        originalUrl: urlInput,
        shortCode,
        alias: aliasInput || undefined,
        createdAt: Date.now(),
        clicks: 0, 
        title: meta.title,
        category: meta.category,
        posterUrl: `https://picsum.photos/seed/${Math.random()}/600/900`,
        history: []
      };

      setLinks(prev => [newLink, ...prev]);
      setUrlInput('');
      setAliasInput('');
      setCurrentPage(AppState.CATALOG);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (code: string) => {
    const url = new URL(window.location.href);
    const basePath = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
    const shortUrl = `${url.origin}${basePath}${code}`;
    
    const el = document.createElement('textarea');
    el.value = shortUrl;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    setCopySuccess(code);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin mb-8"></div>
        <h1 className="text-3xl font-black mb-2 uppercase tracking-widest italic text-[#e50914]">Redirecionando</h1>
        <p className="text-gray-400">Preparando acesso para: <span className="text-white font-bold">{redirecting.title}</span></p>
      </div>
    );
  }

  if (currentPage === AppState.PROFILES) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center animate-fadeIn">
        <h1 className="text-4xl md:text-5xl text-white font-medium mb-10">Quem está encurtando?</h1>
        <div className="flex flex-wrap justify-center gap-8">
          {PROFILES.map(p => (
            <button key={p.id} onClick={() => handleProfileSelect(p)} className="group flex flex-col items-center gap-4 transition-all">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded bg-gray-800 border-4 border-transparent group-hover:border-white overflow-hidden transition-all transform group-hover:scale-105 shadow-2xl">
                <img src={p.avatar} className="w-full h-full object-cover" alt={p.name} />
              </div>
              <span className="text-gray-500 text-xl group-hover:text-white transition-colors">{p.name}</span>
            </button>
          ))}
        </div>
        <button className="mt-20 border border-gray-500 text-gray-500 px-8 py-2 uppercase tracking-widest hover:border-white hover:text-white transition-all">Gerenciar Perfis</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Navbar Estilo Netflix */}
      <nav className={`fixed top-0 w-full z-[100] transition-colors duration-500 flex items-center justify-between px-6 md:px-12 py-4 ${scrolled ? 'bg-[#141414]' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="flex items-center gap-8">
          <div className="text-[#E50914] text-2xl md:text-3xl font-black tracking-tighter cursor-pointer" onClick={() => setCurrentPage(AppState.HOME)}>FASTSHORTS</div>
          <div className="hidden lg:flex items-center gap-5 text-sm">
            <button onClick={() => setCurrentPage(AppState.HOME)} className={`hover:text-gray-300 transition-colors ${currentPage === AppState.HOME ? 'font-bold' : ''}`}>Início</button>
            <button onClick={() => setCurrentPage(AppState.CATALOG)} className={`hover:text-gray-300 transition-colors ${currentPage === AppState.CATALOG ? 'font-bold' : ''}`}>Minha Lista</button>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Search className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
          <Bell className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
          <div className="flex items-center gap-2 cursor-pointer group">
            <img src={activeProfile?.avatar} className="w-8 h-8 rounded" alt="avatar" />
            <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
          </div>
        </div>
      </nav>

      {currentPage === AppState.HOME && (
        <div className="relative">
          {/* Billboard Principal */}
          <div className="relative h-[85vh] w-full">
            <div className="absolute inset-0">
               <img src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover brightness-50" alt="Hero" />
               <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
            </div>

            <div className="absolute bottom-1/4 left-6 md:left-12 max-w-2xl z-10 animate-slideUp">
               <h1 className="text-5xl md:text-8xl font-black mb-4 tracking-tighter drop-shadow-2xl">ENCURTE <br/> AGORA</h1>
               <p className="text-lg md:text-xl text-white font-medium mb-8 drop-shadow-md">Crie links épicos com a tecnologia Gemini. Rápido, seguro e cinematográfico.</p>
               
               <div className="flex flex-col gap-4 bg-black/40 p-6 rounded-lg backdrop-blur-md border border-white/10">
                  <div className="flex flex-col md:flex-row gap-2">
                    <input 
                      type="text" 
                      placeholder="Cole sua URL aqui..."
                      className="flex-1 bg-gray-800/80 border border-transparent focus:border-red-600 rounded px-4 py-3 outline-none"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <button 
                      onClick={createLink}
                      disabled={isProcessing || !urlInput}
                      className="bg-white text-black hover:bg-white/90 px-8 py-3 rounded font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Play className="w-5 h-5 fill-current" /> {isProcessing ? 'GERANDO...' : 'CRIAR'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Alias personalizado (opcional)"
                      className="flex-1 bg-transparent border-b border-gray-600 text-sm py-1 outline-none focus:border-white"
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                    />
                    <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                  </div>
               </div>
            </div>
          </div>

          {/* Linha de Recentes */}
          <div className="px-6 md:px-12 -mt-32 relative z-20 pb-20">
             <h2 className="text-xl font-bold mb-4">Meus Lançamentos Recentes</h2>
             <div className="flex gap-2 overflow-x-auto pb-8 netflix-row">
                {links.slice(0, 10).map(link => (
                  <div key={link.id} onClick={() => setCurrentPage(AppState.CATALOG)} className="flex-none w-40 md:w-56 aspect-[2/3] relative rounded overflow-hidden cursor-pointer group hover:scale-110 hover:z-50 transition-all duration-300 shadow-xl">
                    <img src={link.posterUrl} className="w-full h-full object-cover" alt="poster" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                       <p className="font-bold text-sm truncate uppercase tracking-tighter">{link.title}</p>
                       <p className="text-[10px] text-red-500 font-bold">/{link.alias || link.shortCode}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {currentPage === AppState.CATALOG && (
        <div className="pt-24 px-6 md:px-12 animate-fadeIn pb-20">
          <h2 className="text-3xl font-bold mb-8">Meu Catálogo de Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
             {links.map(link => (
               <div key={link.id} className="bg-[#1a1a1a] rounded overflow-hidden group hover:scale-105 transition-transform shadow-2xl flex flex-col">
                  <div className="aspect-video relative">
                    <img src={`https://picsum.photos/seed/${link.id}/400/225`} className="w-full h-full object-cover" alt="thumb" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                       <button 
                         onClick={() => copyToClipboard(link.alias || link.shortCode)} 
                         className="bg-white text-black p-2 rounded-full hover:bg-gray-200"
                         title="Copiar Link"
                       >
                         {copySuccess === (link.alias || link.shortCode) ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                       </button>
                       <button 
                         onClick={() => { if(confirm("Remover link?")) setLinks(prev => prev.filter(l => l.id !== link.id)) }} 
                         className="bg-[#e50914] text-white p-2 rounded-full"
                         title="Excluir"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-sm uppercase truncate pr-2 tracking-tighter">{link.title}</h3>
                       <span className="text-[10px] bg-red-600 px-1 rounded font-bold">HD</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-4 truncate">{link.originalUrl}</p>
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                       <span className="flex items-center gap-1"><Play className="w-3 h-3 fill-current" /> {link.clicks} visualizações</span>
                       <span className="text-red-600">/{link.alias || link.shortCode}</span>
                    </div>
                  </div>
               </div>
             ))}
          </div>
          {links.length === 0 && (
             <div className="text-center py-20 text-gray-600">
                <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="uppercase font-bold tracking-widest opacity-20">Nenhum título disponível no momento</p>
                <button onClick={() => setCurrentPage(AppState.HOME)} className="mt-4 text-red-600 font-bold hover:underline">Começar a criar agora</button>
             </div>
          )}
        </div>
      )}

      {/* Footer Estilo Netflix */}
      <footer className="px-6 md:px-12 py-20 bg-[#141414] border-t border-white/5 text-gray-600 text-sm">
         <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-3">
               <span className="hover:underline cursor-pointer">Privacidade</span>
               <span className="hover:underline cursor-pointer">Termos de Uso</span>
            </div>
            <div className="flex flex-col gap-3">
               <span className="hover:underline cursor-pointer">Ajuda</span>
               <span className="hover:underline cursor-pointer">Cartão Pré-pago</span>
            </div>
            <div className="flex flex-col gap-3">
               <span className="hover:underline cursor-pointer">Imprensa</span>
               <span className="hover:underline cursor-pointer">Relações</span>
            </div>
            <div className="flex flex-col gap-3">
               <span className="hover:underline cursor-pointer">Entre em contato</span>
               <span className="hover:underline cursor-pointer">GitHub</span>
            </div>
         </div>
         <p className="mt-12 text-center text-[10px]">© 2024 FASTSHORTS - O Melhor Encurtador Cinematográfico</p>
      </footer>
    </div>
  );
};

export default FastShortsPro;
