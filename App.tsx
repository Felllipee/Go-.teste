
import React, { useState, useEffect } from 'https://esm.sh/react@19.0.0';
import { 
  Plus, Trash2, Copy, Search, Bell, ChevronDown, 
  Sparkles, Play, Info, Check, TrendingUp 
} from 'https://esm.sh/lucide-react@0.460.0';
import { suggestAlias, analyzeLinkMetadata } from './services/geminiService.ts';

const PROFILES = [
  { id: '1', name: 'Admin', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Admin&backgroundColor=f59e0b', color: '#f59e0b' },
  { id: '2', name: 'Dev', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Dev&backgroundColor=1e3a8a', color: '#1e3a8a' },
  { id: '3', name: 'Visitante', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Guest&backgroundColor=dc2626', color: '#dc2626' },
];

export default function App() {
  const [view, setView] = useState('PROFILES');
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copyCode, setCopyCode] = useState(null);
  const [redirecting, setRedirecting] = useState(null);

  // Lógica de Redirecionamento (Simula o Backend)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('c');
    if (code) {
      const cleanCode = code.replace(/\/$/, '').split('/').pop();
      const saved = JSON.parse(localStorage.getItem('netflix_links') || '[]');
      const link = saved.find(l => l.shortCode === cleanCode || l.alias === cleanCode);
      
      if (link) {
        setRedirecting(link.title);
        link.clicks++;
        localStorage.setItem('netflix_links', JSON.stringify(saved));
        setTimeout(() => window.location.href = link.originalUrl, 2000);
      } else {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('netflix_links');
    if (saved) setLinks(JSON.parse(saved));
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem('netflix_links', JSON.stringify(links));
  }, [links]);

  const createLink = async () => {
    if (!urlInput) return;
    setLoading(true);
    try {
      const meta = await analyzeLinkMetadata(urlInput);
      const code = Math.random().toString(36).substring(2, 8);
      const newLink = {
        id: Date.now().toString(),
        originalUrl: urlInput,
        shortCode: code,
        alias: aliasInput || null,
        clicks: 0,
        title: meta.title,
        category: meta.category,
        poster: `https://picsum.photos/seed/${Math.random()}/600/900`
      };
      setLinks([newLink, ...links]);
      setUrlInput('');
      setAliasInput('');
      setView('CATALOG');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copy = (code) => {
    const url = window.location.origin + window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + code;
    navigator.clipboard.writeText(url);
    setCopyCode(code);
    setTimeout(() => setCopyCode(null), 2000);
  };

  if (redirecting) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white p-10">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h1 className="text-3xl font-black italic text-red-600 mb-2 uppercase tracking-tighter">Iniciando Episódio</h1>
        <p className="text-gray-400">Título: <span className="text-white">{redirecting}</span></p>
      </div>
    );
  }

  if (view === 'PROFILES') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#141414] animate-in fade-in duration-700">
        <h1 className="text-4xl md:text-5xl text-white font-medium mb-12">Quem está encurtando?</h1>
        <div className="flex gap-8">
          {PROFILES.map(p => (
            <button key={p.id} onClick={() => { setUser(p); setView('HOME'); }} className="group flex flex-col items-center gap-4">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded bg-gray-800 border-4 border-transparent group-hover:border-white transition-all overflow-hidden transform group-hover:scale-105">
                <img src={p.avatar} className="w-full h-full object-cover" />
              </div>
              <span className="text-gray-500 text-xl group-hover:text-white transition-colors">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white selection:bg-red-600 selection:text-white">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 px-6 md:px-12 py-4 flex items-center justify-between ${scrolled ? 'bg-[#141414]' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="flex items-center gap-10">
          <div onClick={() => setView('HOME')} className="text-[#E50914] text-3xl font-black tracking-tighter cursor-pointer">FASTSHORTS</div>
          <nav className="hidden lg:flex gap-6 text-sm">
            <button onClick={() => setView('HOME')} className={view === 'HOME' ? 'font-bold' : 'text-gray-300 hover:text-white transition-colors'}>Início</button>
            <button onClick={() => setView('CATALOG')} className={view === 'CATALOG' ? 'font-bold' : 'text-gray-300 hover:text-white transition-colors'}>Minha Lista</button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <Search className="w-5 h-5 cursor-pointer" />
          <Bell className="w-5 h-5 cursor-pointer" />
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setView('PROFILES')}>
            <img src={user?.avatar} className="w-8 h-8 rounded" />
            <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
          </div>
        </div>
      </header>

      {view === 'HOME' && (
        <main>
          {/* Billboard */}
          <div className="relative h-[85vh] w-full">
            <div className="absolute inset-0">
              <img src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2073&auto=format&fit=crop" className="w-full h-full object-cover brightness-50" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
            </div>

            <div className="absolute bottom-[20%] left-6 md:left-12 max-w-2xl">
              <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter uppercase italic drop-shadow-2xl">Lançamento <br/> Mundial</h1>
              <p className="text-xl mb-8 font-medium drop-shadow-md">A nova era dos links encurtados chegou. Inteligência Artificial, estética Premium e velocidade total.</p>
              
              <div className="bg-black/40 p-6 rounded-xl border border-white/10 backdrop-blur-md flex flex-col gap-4 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="Cole seu link original aqui..." 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-gray-900/90 border border-transparent focus:border-red-600 rounded px-4 py-4 outline-none text-lg transition-all"
                  />
                  <button 
                    disabled={loading || !urlInput}
                    onClick={createLink}
                    className="bg-white text-black hover:bg-white/90 px-10 py-4 rounded font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Play className="w-6 h-6 fill-current" /> {loading ? 'GERANDO...' : 'ENCURTAR'}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="text" 
                    placeholder="Alias personalizado" 
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    className="bg-transparent border-b border-gray-600 focus:border-white outline-none text-sm py-1 transition-all"
                  />
                  <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Row */}
          <div className="px-6 md:px-12 -mt-32 relative z-10 pb-20">
            <h2 className="text-xl font-bold mb-4 tracking-tight">Recém Adicionados</h2>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-10">
              {links.map(link => (
                <div key={link.id} onClick={() => setView('CATALOG')} className="flex-none w-44 md:w-60 aspect-[2/3] relative rounded overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:z-50 shadow-2xl group">
                  <img src={link.poster} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="font-bold text-sm uppercase truncate">{link.title}</p>
                    <p className="text-[10px] text-red-500 font-black">/{link.alias || link.shortCode}</p>
                  </div>
                </div>
              ))}
              {links.length === 0 && <div className="text-gray-600 uppercase font-black tracking-widest text-xs opacity-50 py-20">Nenhum título no catálogo</div>}
            </div>
          </div>
        </main>
      )}

      {view === 'CATALOG' && (
        <div className="pt-28 px-6 md:px-12 min-h-screen pb-20 animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Minha Lista de Lançamentos</h2>
            <button onClick={() => setView('HOME')} className="text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded font-bold transition-all">Novo Link</button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {links.map(link => (
              <div key={link.id} className="bg-[#1a1a1a] rounded overflow-hidden group hover:scale-105 transition-all shadow-2xl flex flex-col border border-white/5">
                <div className="aspect-video relative overflow-hidden">
                  <img src={`https://picsum.photos/seed/${link.id}/500/280`} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button onClick={() => copy(link.alias || link.shortCode)} className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform">
                      {copyCode === (link.alias || link.shortCode) ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setLinks(links.filter(l => l.id !== link.id))} className="bg-red-600 text-white p-3 rounded-full hover:scale-110 transition-transform">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm uppercase truncate mb-1 tracking-tighter">{link.title}</h3>
                    <p className="text-[10px] text-red-600 font-bold mb-3">/{link.alias || link.shortCode}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] text-gray-500 font-bold">
                    <span>{link.clicks} VISUALIZAÇÕES</span>
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-6 md:px-12 py-20 bg-[#141414] border-t border-white/5 text-gray-500 text-xs">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <span className="hover:underline cursor-pointer">Privacidade</span>
            <span className="hover:underline cursor-pointer">Termos de Uso</span>
          </div>
          <div className="flex flex-col gap-4">
            <span className="hover:underline cursor-pointer">Ajuda</span>
            <span className="hover:underline cursor-pointer">Avisos Legais</span>
          </div>
          <div className="flex flex-col gap-4">
            <span className="hover:underline cursor-pointer">Conta</span>
            <span className="hover:underline cursor-pointer">Relações</span>
          </div>
          <div className="flex flex-col gap-4">
            <span className="hover:underline cursor-pointer">GitHub</span>
            <span className="hover:underline cursor-pointer">Entre em contato</span>
          </div>
        </div>
        <p className="mt-16 text-center opacity-30 uppercase font-black tracking-tighter">© 2024 FASTSHORTS INC. - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
