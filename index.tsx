
import React, { useState, useEffect } from 'https://esm.sh/react@19.0.0';
import ReactDOM from 'https://esm.sh/react-dom@19.0.0/client';
import { 
  Plus, Trash2, Copy, Search, Bell, ChevronDown, 
  Sparkles, Play, Info, Check, TrendingUp, X, ExternalLink,
  Settings, History, Share2, MoreHorizontal
} from 'https://esm.sh/lucide-react@0.460.0';
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.41.0";

// --- AI Service Logic ---
const getAIResponse = async (url: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context: You are a Netflix content manager. Analyze this URL: ${url}. 
                 Create a creative cinematic movie/series title (max 20 chars) and a genre category (e.g., Action, Romance, Original Series). 
                 Return ONLY a JSON object: {"title": "The Title", "category": "The Category"}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Metadata error:", e);
    return { title: "New Release", category: "Trending Link" };
  }
};

// --- Main App Component ---
const App = () => {
  const [view, setView] = useState('PROFILES'); // PROFILES, HOME, CATALOG
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [redirecting, setRedirecting] = useState(null);

  const PROFILES = [
    { id: '1', name: 'Premium', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Admin&backgroundColor=f59e0b' },
    { id: '2', name: 'Dev', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Dev&backgroundColor=1e3a8a' },
    { id: '3', name: 'Kids', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kids&backgroundColor=dc2626' },
  ];

  useEffect(() => {
    // Load existing links
    const saved = localStorage.getItem('fastshorts_storage_v1');
    if (saved) setLinks(JSON.parse(saved));

    // Scroll listener for header
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Redirection detection logic (?c=XXXX)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('c');
    if (code) {
      const cleanCode = code.replace(/\/$/, '').split('/').pop();
      const currentDb = JSON.parse(localStorage.getItem('fastshorts_storage_v1') || '[]');
      const target = currentDb.find(l => l.shortCode === cleanCode || l.alias === cleanCode);
      
      if (target) {
        setRedirecting(target.title);
        target.clicks = (target.clicks || 0) + 1;
        localStorage.setItem('fastshorts_storage_v1', JSON.stringify(currentDb));
        // Cinematic delay for redirection
        setTimeout(() => window.location.href = target.originalUrl, 2500);
      } else {
        // Clear URL if invalid
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem('fastshorts_storage_v1', JSON.stringify(links));
  }, [links]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    setLoading(true);

    try {
      const metadata = await getAIResponse(urlInput);
      const shortCode = Math.random().toString(36).substring(2, 8);
      
      const newLink = {
        id: Date.now().toString(),
        originalUrl: urlInput,
        shortCode: shortCode,
        alias: aliasInput || null,
        title: metadata.title,
        category: metadata.category,
        clicks: 0,
        poster: `https://picsum.photos/seed/${Math.random()}/600/900`,
        createdAt: new Date().toISOString()
      };

      setLinks(prev => [newLink, ...prev]);
      setUrlInput('');
      setAliasInput('');
      setView('CATALOG');
    } catch (err) {
      alert("Error generating your short link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id, code) => {
    const fullUrl = `${window.location.origin}${window.location.pathname}?c=${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = (id) => {
    if (confirm("Remove this production from your list?")) {
      setLinks(prev => prev.filter(l => l.id !== id));
    }
  };

  // Redirection Screen
  if (redirecting) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center animate-fadeIn text-center p-8">
        <div className="relative mb-12">
          <div className="w-24 h-24 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-red-600 text-2xl">N</div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black italic text-red-600 mb-4 uppercase tracking-tighter drop-shadow-2xl">
          Iniciando Produção
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-md">
          Aguarde enquanto carregamos: <br/>
          <span className="text-white font-black block mt-2 text-3xl md:text-4xl">{redirecting}</span>
        </p>
        <p className="mt-12 text-gray-600 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">
          Streamed via FastShorts Original
        </p>
      </div>
    );
  }

  // Profiles Selection Screen
  if (view === 'PROFILES') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#141414] animate-fadeIn">
        <h1 className="text-4xl md:text-5xl text-white font-medium mb-12">Quem está encurtando agora?</h1>
        <div className="flex flex-wrap justify-center gap-10 px-6">
          {PROFILES.map(p => (
            <button 
              key={p.id} 
              onClick={() => { setUser(p); setView('HOME'); }}
              className="group flex flex-col items-center gap-4 outline-none"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded bg-gray-800 border-[3px] border-transparent group-hover:border-white transition-all overflow-hidden transform group-hover:scale-105 shadow-2xl">
                <img src={p.avatar} className="w-full h-full object-cover" alt={p.name} />
              </div>
              <span className="text-gray-500 text-xl group-hover:text-white transition-colors">{p.name}</span>
            </button>
          ))}
        </div>
        <button className="mt-24 border border-gray-600 text-gray-600 px-8 py-2 uppercase tracking-[0.2em] hover:border-white hover:text-white transition-all text-sm font-bold">
          Gerenciar Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white selection:bg-red-600 selection:text-white">
      {/* Navigation */}
      <header className={`fixed top-0 w-full z-[100] transition-all duration-500 flex items-center justify-between px-6 md:px-12 py-5 ${scrolled ? 'bg-[#141414] shadow-2xl border-b border-white/5' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="flex items-center gap-12">
          <div onClick={() => setView('HOME')} className="text-red-600 text-4xl font-black tracking-tighter cursor-pointer select-none transform transition-transform active:scale-95">FASTSHORTS</div>
          <nav className="hidden lg:flex gap-8 text-sm font-medium">
            <button onClick={() => setView('HOME')} className={`hover:text-gray-400 transition-colors ${view === 'HOME' ? 'font-black border-b-2 border-red-600 pb-1' : ''}`}>Início</button>
            <button onClick={() => setView('CATALOG')} className={`hover:text-gray-400 transition-colors ${view === 'CATALOG' ? 'font-black border-b-2 border-red-600 pb-1' : ''}`}>Minha Lista</button>
          </nav>
        </div>
        <div className="flex items-center gap-8">
          <Search className="w-5 h-5 cursor-pointer hover:text-gray-400" />
          <Bell className="w-5 h-5 cursor-pointer hover:text-gray-400" />
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setView('PROFILES')}>
            <img src={user?.avatar} className="w-8 h-8 rounded" alt="profile" />
            <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
          </div>
        </div>
      </header>

      {view === 'HOME' && (
        <main className="animate-fadeIn">
          {/* Billboard / Banner Section */}
          <div className="relative h-[95vh] w-full flex items-center">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop" 
                className="w-full h-full object-cover brightness-[0.3]" 
                alt="banner"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
            </div>

            <div className="relative z-10 px-6 md:px-12 max-w-5xl pt-20 animate-slideUp">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 bg-red-600 flex items-center justify-center rounded-sm font-black text-xs text-white">N</div>
                <span className="text-gray-400 font-bold tracking-[0.5em] text-xs uppercase">Original Production</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter uppercase italic drop-shadow-2xl leading-none">
                Corte <br/> Final
              </h1>
              <p className="text-xl md:text-2xl mb-12 font-medium text-gray-200 drop-shadow-lg leading-relaxed max-w-3xl">
                O premiado encurtador de links que você conhece, agora com inteligência artificial para categorizar seus cliques como grandes lançamentos de Hollywood.
              </p>
              
              {/* Shorten Bar */}
              <form onSubmit={handleShorten} className="bg-black/50 p-6 md:p-10 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-8 max-w-3xl">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1 relative">
                    <input 
                      type="url" 
                      required
                      placeholder="Insira o link original para produção..." 
                      className="w-full bg-gray-900/90 border-2 border-transparent focus:border-red-600 rounded-xl px-7 py-5 outline-none text-xl transition-all font-medium placeholder:text-gray-500"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading || !urlInput}
                    className="bg-white text-black hover:bg-gray-200 px-12 py-5 rounded-xl font-black flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 min-w-[200px] text-lg"
                  >
                    {loading ? (
                      <div className="w-7 h-7 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <><Play className="w-7 h-7 fill-current" /> ENCURTAR</>
                    )}
                  </button>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8 border-t border-white/5 pt-6">
                   <div className="flex-1 w-full relative group">
                    <input 
                      type="text" 
                      placeholder="Nome artístico do link (Alias)" 
                      className="w-full bg-transparent border-b-2 border-gray-600 focus:border-white outline-none py-2 text-md font-bold transition-all"
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                    />
                    <Sparkles className="absolute right-0 top-3 w-4 h-4 text-yellow-500 animate-pulse" />
                   </div>
                   <div className="flex items-center gap-3 text-red-500 text-sm font-black uppercase tracking-widest whitespace-nowrap">
                      <TrendingUp className="w-5 h-5" /> Top 1 no Brasil hoje
                   </div>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Browse Section */}
          <div className="px-6 md:px-12 -mt-32 relative z-20 pb-40">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Recém Produzidos</h2>
                <button onClick={() => setView('CATALOG')} className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-1 group transition-colors">
                  Ver Tudo <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
             <div className="flex gap-5 overflow-x-auto no-scrollbar pb-10 scroll-smooth">
                {links.length > 0 ? links.slice(0, 10).map(link => (
                  <div 
                    key={link.id} 
                    onClick={() => setView('CATALOG')}
                    className="flex-none w-52 md:w-64 aspect-[2/3] relative rounded-md overflow-hidden cursor-pointer transition-transform duration-500 hover:scale-110 hover:z-50 shadow-2xl group"
                  >
                    <img src={link.poster} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000" alt={link.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="font-black text-md uppercase truncate mb-2 drop-shadow-lg">{link.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded-sm font-black italic">NEW</span>
                        <span className="text-[10px] text-gray-300 font-bold uppercase">{link.category}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="w-full h-56 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-600 font-bold uppercase tracking-[0.2em] gap-4">
                    <Info className="w-10 h-10 opacity-20" />
                    Catálogo de Produções Vazio
                  </div>
                )}
             </div>
          </div>
        </main>
      )}

      {view === 'CATALOG' && (
        <div className="pt-32 px-6 md:px-12 min-h-screen pb-40 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
             <div className="flex items-end gap-5">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Minha Lista</h2>
                <span className="bg-white/10 px-4 py-1.5 rounded-full text-xs font-black text-gray-400 uppercase tracking-widest">{links.length} Títulos</span>
             </div>
             <div className="flex gap-4 w-full md:w-auto">
               <button 
                onClick={() => setView('HOME')}
                className="flex-1 md:flex-none bg-white text-black px-8 py-3 rounded-lg font-black text-sm uppercase flex items-center justify-center gap-3 hover:bg-gray-200 transition-all active:scale-95"
               >
                 <Plus className="w-5 h-5" /> Adicionar à Produção
               </button>
               <button className="bg-white/10 hover:bg-white/20 p-3 rounded-lg transition-colors">
                  <Settings className="w-6 h-6" />
               </button>
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 md:gap-12">
            {links.map(link => (
              <div key={link.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden flex flex-col group transition-all duration-300 hover:scale-105 shadow-2xl border border-white/5">
                 <div className="aspect-video relative overflow-hidden bg-gray-900">
                    <img src={link.poster} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500" alt={link.title} />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-5">
                       <button 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(link.id, link.alias || link.shortCode); }}
                        className="bg-white text-black p-4 rounded-full hover:scale-125 transition-transform shadow-2xl"
                        title="Copiar Link de Estreia"
                       >
                          {copiedId === link.id ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                       </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); deleteLink(link.id); }}
                        className="bg-red-600 text-white p-4 rounded-full hover:scale-125 transition-transform shadow-2xl"
                        title="Remover Título"
                       >
                          <Trash2 className="w-6 h-6" />
                       </button>
                    </div>
                    <div className="absolute top-3 left-3 flex gap-2">
                       {link.clicks > 15 && <div className="bg-red-600 px-2 py-0.5 rounded-sm font-black text-[10px] shadow-lg italic uppercase">Top 10</div>}
                       <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-sm font-black text-[10px] shadow-lg uppercase tracking-widest">{link.category}</div>
                    </div>
                 </div>
                 <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-black text-lg uppercase truncate pr-4 drop-shadow-md">{link.title}</h3>
                        <span className="text-[10px] text-gray-500 font-black border border-gray-700 px-1.5 py-0.5 rounded-sm mt-1">4K</span>
                      </div>
                      <p className="text-xs text-red-600 font-black mb-6 uppercase tracking-widest break-all">
                        /{link.alias || link.shortCode}
                      </p>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                       <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                          <span className="flex items-center gap-2 text-gray-400">
                             <History className="w-4 h-4" /> {link.clicks || 0} Exibições
                          </span>
                          <span className="text-green-500 flex items-center gap-2">
                             <TrendingUp className="w-4 h-4" /> 98% Relevante
                          </span>
                       </div>
                       <div className="text-[10px] text-gray-600 truncate font-bold italic bg-black/30 p-2 rounded">
                          Source: {link.originalUrl}
                       </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>

          {links.length === 0 && (
            <div className="flex flex-col items-center justify-center py-52 opacity-10">
               <Share2 className="w-40 h-40 mb-8" />
               <p className="text-5xl font-black uppercase tracking-tighter italic">Catálogo Vazio</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Branding */}
      <footer className="bg-[#141414] border-t border-white/5 px-6 md:px-12 py-32 text-gray-500">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-8 mb-16 text-gray-400">
             <Share2 className="w-7 h-7 cursor-pointer hover:text-white transition-colors" />
             <ExternalLink className="w-7 h-7 cursor-pointer hover:text-white transition-colors" />
             <MoreHorizontal className="w-7 h-7 cursor-pointer hover:text-white transition-colors" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-24 text-sm font-medium">
            <div className="flex flex-col gap-5">
              <span className="hover:underline cursor-pointer">Audiodescrição</span>
              <span className="hover:underline cursor-pointer">Relações com investidores</span>
              <span className="hover:underline cursor-pointer">Avisos legais</span>
            </div>
            <div className="flex flex-col gap-5">
              <span className="hover:underline cursor-pointer">Central de ajuda</span>
              <span className="hover:underline cursor-pointer">Carreiras</span>
              <span className="hover:underline cursor-pointer">Preferências de cookies</span>
            </div>
            <div className="flex flex-col gap-5">
              <span className="hover:underline cursor-pointer">Cartão pré-pago</span>
              <span className="hover:underline cursor-pointer">Termos de uso</span>
              <span className="hover:underline cursor-pointer">Informações corporativas</span>
            </div>
            <div className="flex flex-col gap-5">
              <span className="hover:underline cursor-pointer">Imprensa</span>
              <span className="hover:underline cursor-pointer">Privacidade</span>
              <span className="hover:underline cursor-pointer">Entre em contato</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-white/5">
             <div className="text-[11px] font-black tracking-[0.4em] uppercase italic opacity-40">
                © 2024-2025 FASTSHORTS STUDIOS & BITLY THEME. THE PREMIERE SHORTENER.
             </div>
             <button className="border border-gray-700 px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:border-white hover:text-white transition-all">
                CÓDIGO DE SERVIÇO: FS-9981-AI
             </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Render final app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
