
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@19.0.0';
import ReactDOM from 'https://esm.sh/react-dom@19.0.0/client';
import { 
  Plus, Trash2, Copy, Search, Bell, ChevronDown, 
  Sparkles, Play, Info, Check, TrendingUp, X, ExternalLink,
  Settings, History, Share2, MoreHorizontal, LayoutGrid, List
} from 'https://esm.sh/lucide-react@0.460.0';
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.41.0";

// --- Types ---
interface ShortLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  alias: string | null;
  title: string;
  category: string;
  clicks: number;
  poster: string;
  createdAt: string;
}

// --- AI Service Logic ---
const getAIResponse = async (url: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context: You are a Netflix content manager. Analyze this URL: ${url}. 
                 Create a creative cinematic movie/series title (max 20 chars) and a genre category (e.g., Ação, Comédia, Original Netflix). 
                 Return ONLY a JSON object: {"title": "The Title", "category": "The Category"}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Metadata error:", e);
    return { title: "Novo Lançamento", category: "Trending Link" };
  }
};

const suggestAlias = async (url: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sugira 3 nomes curtos e impactantes estilo Netflix para este URL: ${url}. Ex: pipoca-play, spoiler-link. Retorne apenas JSON ["a", "b", "c"].`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return ["play-agora", "acesso-premium", "link-vip"];
  }
};

// --- Main App Component ---
const App = () => {
  const [view, setView] = useState('PROFILES'); // PROFILES, HOME, CATALOG
  const [user, setUser] = useState<{name: string, avatar: string} | null>(null);
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const PROFILES = [
    { id: '1', name: 'Administrador', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Admin&backgroundColor=f59e0b' },
    { id: '2', name: 'Desenvolvedor', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Dev&backgroundColor=1e3a8a' },
    { id: '3', name: 'Visitante', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Guest&backgroundColor=dc2626' },
  ];

  const STORAGE_KEY = 'fastshorts_v2_storage';

  useEffect(() => {
    // Load existing links
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLinks(JSON.parse(saved));

    // Scroll listener for header
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Redirection detection logic (?c=XXXX)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('c');
    if (code) {
      // Decode potential GitHub Pages routing
      const cleanCode = code.replace(/\/$/, '').split('/').pop();
      const currentDb: ShortLink[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const target = currentDb.find(l => l.shortCode === cleanCode || l.alias === cleanCode);
      
      if (target) {
        setRedirecting(target.title);
        target.clicks = (target.clicks || 0) + 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentDb));
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
    if (links.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    }
  }, [links]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    setLoading(true);

    try {
      const metadata = await getAIResponse(urlInput);
      const shortCode = Math.random().toString(36).substring(2, 8);
      
      const newLink: ShortLink = {
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
      setSuggestions([]);
      setView('CATALOG');
    } catch (err) {
      alert("Erro ao produzir seu link cinematográfico.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!urlInput) return;
    setLoading(true);
    const results = await suggestAlias(urlInput);
    setSuggestions(results);
    setLoading(false);
  };

  const copyToClipboard = (id: string, code: string) => {
    // Correct URL for GitHub Pages or local
    const baseUrl = window.location.origin + window.location.pathname;
    const separator = baseUrl.includes('?') ? '&' : '?';
    const fullUrl = `${baseUrl}${separator}c=${code}`;
    
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = (id: string) => {
    if (confirm("Remover este título da sua lista?")) {
      const newLinks = links.filter(l => l.id !== id);
      setLinks(newLinks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLinks));
    }
  };

  const filteredLinks = links.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.alias && l.alias.toLowerCase().includes(searchQuery.toLowerCase())) ||
    l.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Redirection Screen
  if (redirecting) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center animate-fadeIn text-center p-8">
        <div className="relative mb-12">
          <div className="w-24 h-24 border-[6px] border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-red-600 text-3xl">N</div>
        </div>
        <h1 className="text-4xl md:text-6xl font-black italic text-red-600 mb-4 uppercase tracking-tighter drop-shadow-2xl">
          Redirecionando
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-md">
          Aguarde a reprodução de: <br/>
          <span className="text-white font-black block mt-2 text-3xl md:text-4xl">{redirecting}</span>
        </p>
        <p className="mt-20 text-gray-700 text-[10px] font-bold uppercase tracking-[0.5em] animate-pulse">
          FastShorts Originals ©
        </p>
      </div>
    );
  }

  // Profiles Selection Screen
  if (view === 'PROFILES') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#141414] animate-fadeIn">
        <h1 className="text-3xl md:text-5xl text-white font-medium mb-12 tracking-tight">Quem está encurtando agora?</h1>
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 px-6">
          {PROFILES.map(p => (
            <button 
              key={p.id} 
              onClick={() => { setUser(p); setView('HOME'); }}
              className="group flex flex-col items-center gap-4 outline-none"
            >
              <div className="w-28 h-28 md:w-40 md:h-40 rounded bg-gray-800 border-[3px] border-transparent group-hover:border-white transition-all overflow-hidden transform group-hover:scale-105 shadow-2xl">
                <img src={p.avatar} className="w-full h-full object-cover" alt={p.name} />
              </div>
              <span className="text-gray-500 text-lg md:text-xl group-hover:text-white transition-colors">{p.name}</span>
            </button>
          ))}
        </div>
        <button className="mt-20 border border-gray-600 text-gray-500 px-8 py-2 uppercase tracking-[0.1em] hover:border-white hover:text-white transition-all text-sm font-bold">
          Gerenciar Perfis
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white selection:bg-red-600 selection:text-white font-sans overflow-x-hidden">
      {/* Navigation */}
      <header className={`fixed top-0 w-full z-[100] transition-all duration-500 flex items-center justify-between px-6 md:px-12 py-3 md:py-4 ${scrolled ? 'bg-[#141414] shadow-2xl border-b border-white/5' : 'bg-gradient-to-b from-black/90 to-transparent'}`}>
        <div className="flex items-center gap-6 md:gap-12">
          <div onClick={() => setView('HOME')} className="text-red-600 text-2xl md:text-3xl font-black tracking-tighter cursor-pointer select-none transform transition-transform active:scale-95">FASTSHORTS</div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <button onClick={() => setView('HOME')} className={`hover:text-gray-300 transition-colors ${view === 'HOME' ? 'text-white font-bold' : 'text-gray-400'}`}>Início</button>
            <button onClick={() => setView('CATALOG')} className={`hover:text-gray-300 transition-colors ${view === 'CATALOG' ? 'text-white font-bold' : 'text-gray-400'}`}>Minha Lista</button>
          </nav>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          <div className="relative hidden md:flex items-center group">
            <Search className="w-5 h-5 absolute left-3 text-gray-400 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Títulos, aliases..." 
              className="bg-black/40 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm focus:w-64 w-40 transition-all outline-none focus:border-white/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Bell className="w-5 h-5 cursor-pointer hover:text-gray-400 transition-colors" />
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setView('PROFILES')}>
            <img src={user?.avatar} className="w-8 h-8 rounded" alt="profile" />
            <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
          </div>
        </div>
      </header>

      {view === 'HOME' && (
        <main className="animate-fadeIn relative">
          {/* Billboard / Banner Section */}
          <div className="relative h-[85vh] md:h-[95vh] w-full flex items-center overflow-hidden">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" 
                className="w-full h-full object-cover brightness-[0.4]" 
                alt="banner"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/20 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
            </div>

            <div className="relative z-10 px-6 md:px-12 w-full max-w-5xl mt-20 animate-slideUp">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-red-600 flex items-center justify-center rounded-sm font-black text-[10px] text-white">N</div>
                <span className="text-gray-300 font-bold tracking-[0.4em] text-[10px] uppercase">Original FastShorts</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic drop-shadow-2xl leading-none">
                Corte <br className="hidden md:block"/> Final
              </h1>
              <p className="text-lg md:text-2xl mb-10 font-medium text-gray-200 drop-shadow-lg leading-relaxed max-w-2xl">
                O premiado encurtador de links que transforma seus cliques em grandes lançamentos. Com tecnologia IA para curadoria instantânea de metadados.
              </p>
              
              {/* Shorten Bar - Refined for Desktop */}
              <div className="flex flex-col gap-4 max-w-3xl">
                <form onSubmit={handleShorten} className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 relative">
                    <input 
                      type="url" 
                      required
                      placeholder="Insira o link para produção..." 
                      className="w-full bg-[#333]/80 hover:bg-[#444]/80 border border-transparent focus:bg-[#444] rounded-md px-6 py-4 outline-none text-lg transition-all font-medium placeholder:text-gray-400"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading || !urlInput}
                    className="bg-white text-black hover:bg-gray-200 px-10 py-4 rounded-md font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 text-lg"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <><Play className="w-6 h-6 fill-current" /> Assistir</>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setView('CATALOG')}
                    className="bg-gray-500/50 hover:bg-gray-500/70 text-white px-8 py-4 rounded-md font-bold flex items-center justify-center gap-3 transition-all text-lg backdrop-blur-md"
                  >
                    <Info className="w-6 h-6" /> Minha Lista
                  </button>
                </form>

                <div className="flex flex-wrap items-center gap-4 bg-black/20 p-4 rounded-lg backdrop-blur-sm border border-white/5">
                  <div className="flex-1 min-w-[200px] relative group">
                    <input 
                      type="text" 
                      placeholder="Alias personalizado (opcional)" 
                      className="w-full bg-transparent border-b border-gray-600 focus:border-white outline-none py-1 text-sm font-bold transition-all"
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                    />
                    <Sparkles className="absolute right-0 top-1 w-4 h-4 text-yellow-500 animate-pulse" />
                  </div>
                  <div className="h-4 w-px bg-white/10 hidden md:block"></div>
                  <button 
                    type="button" 
                    onClick={fetchSuggestions}
                    className="text-[10px] uppercase font-black tracking-widest text-red-500 hover:text-red-400 transition-colors"
                  >
                    Sugerir com IA
                  </button>
                </div>

                {suggestions.length > 0 && (
                  <div className="flex gap-2 animate-fadeIn">
                    {suggestions.map(s => (
                      <button 
                        key={s} 
                        onClick={() => setAliasInput(s)}
                        className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-[10px] font-bold uppercase border border-white/5 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Featured Rows */}
          <div className="px-6 md:px-12 -mt-20 md:-mt-32 relative z-20 pb-40 space-y-12">
             <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">Em Alta na Minha Lista</h2>
                </div>
                <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-6 scroll-smooth">
                    {links.length > 0 ? links.slice(0, 10).map((link, idx) => (
                      <div 
                        key={link.id} 
                        className="flex-none group relative w-44 md:w-64 aspect-video rounded-md overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:z-50 shadow-2xl"
                      >
                        <img src={link.poster} className="w-full h-full object-cover" alt={link.title} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                           <div className="flex items-center gap-2 mb-2">
                              <button onClick={() => copyToClipboard(link.id, link.alias || link.shortCode)} className="bg-white text-black p-2 rounded-full hover:bg-gray-200">
                                <Copy className="w-3 h-3" />
                              </button>
                              <button className="bg-black/50 border border-white/40 text-white p-2 rounded-full">
                                <Plus className="w-3 h-3" />
                              </button>
                           </div>
                           <p className="font-bold text-xs uppercase truncate leading-none mb-1">{link.title}</p>
                           <div className="flex items-center gap-2 text-[10px] font-bold">
                              <span className="text-green-500">{90 + idx}% Relevante</span>
                              <span className="border border-white/40 px-1 rounded-sm text-[8px]">4K</span>
                           </div>
                        </div>
                      </div>
                    )) : (
                      <div className="w-full py-12 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-gray-600 font-bold uppercase text-xs tracking-widest gap-2">
                         <LayoutGrid className="opacity-20 w-8 h-8" />
                         Seu catálogo está vazio
                      </div>
                    )}
                </div>
             </section>

             <section>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-4">Ação e Aventura</h2>
                <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-6 scroll-smooth">
                   {[1,2,3,4,5,6].map(i => (
                     <div key={i} className="flex-none w-44 md:w-64 aspect-video rounded-md overflow-hidden bg-[#222] animate-pulse"></div>
                   ))}
                </div>
             </section>
          </div>
        </main>
      )}

      {view === 'CATALOG' && (
        <div className="pt-24 md:pt-32 px-6 md:px-12 min-h-screen pb-40 animate-fadeIn max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-white/5 pb-8">
             <div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">Minha Lista</h2>
                <p className="text-gray-500 text-sm font-bold mt-2 uppercase tracking-widest">{filteredLinks.length} Títulos Encontrados</p>
             </div>
             <div className="flex gap-3 w-full md:w-auto">
               <button 
                onClick={() => setView('HOME')}
                className="flex-1 md:flex-none bg-white text-black px-6 py-2.5 rounded font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
               >
                 <Plus className="w-5 h-5" /> Adicionar
               </button>
               <div className="bg-black/20 border border-white/10 flex rounded p-1">
                  <button className="p-2 hover:bg-white/5 rounded text-white"><LayoutGrid className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-white/5 rounded text-gray-500"><List className="w-4 h-4" /></button>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-12">
            {filteredLinks.map(link => (
              <div key={link.id} className="group relative transition-all duration-300">
                 <div className="aspect-video relative rounded-md overflow-hidden bg-[#1a1a1a] shadow-lg group-hover:shadow-red-600/10 transition-all">
                    <img src={link.poster} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" alt={link.title} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                       <div className="flex items-center gap-2 mb-4">
                          <button 
                            onClick={() => copyToClipboard(link.id, link.alias || link.shortCode)}
                            className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform shadow-2xl"
                            title="Copiar Link"
                          >
                            {copiedId === link.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => deleteLink(link.id)}
                            className="bg-black/50 border border-white/40 text-white p-3 rounded-full hover:scale-110 transition-transform shadow-2xl"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                    <div className="absolute top-2 left-2 flex gap-1">
                       {link.clicks > 10 && <div className="bg-red-600 px-1.5 py-0.5 rounded-sm font-black text-[8px] uppercase italic">Top 10</div>}
                       <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-sm font-black text-[8px] uppercase tracking-tighter">{link.category}</div>
                    </div>
                 </div>
                 
                 <div className="mt-3">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm md:text-base uppercase truncate pr-2 group-hover:text-red-500 transition-colors">{link.title}</h3>
                        <span className="text-[9px] text-gray-500 font-bold border border-gray-800 px-1 rounded-sm mt-1">HD</span>
                    </div>
                    <p className="text-[11px] text-red-600 font-black mb-3 uppercase tracking-tighter break-all opacity-80">
                      /{link.alias || link.shortCode}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest pt-2 border-t border-white/5">
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <History className="w-3 h-3" /> {link.clicks || 0} Clicks
                        </span>
                        <span className="text-green-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> 98%
                        </span>
                    </div>
                 </div>
              </div>
            ))}
          </div>

          {filteredLinks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 opacity-10">
               <Share2 className="w-32 h-32 mb-6" />
               <p className="text-3xl font-black uppercase tracking-tighter italic">Nenhum resultado</p>
            </div>
          )}
        </div>
      )}

      {/* Global Footer */}
      <footer className="bg-[#141414] border-t border-white/5 px-6 md:px-12 py-20 text-gray-500 mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-6 mb-10 text-gray-400">
             <Share2 className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
             <ExternalLink className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
             <MoreHorizontal className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 text-xs md:text-sm font-medium">
            <div className="flex flex-col gap-4">
              <span className="hover:underline cursor-pointer">Privacidade</span>
              <span className="hover:underline cursor-pointer">Relações com investidores</span>
              <span className="hover:underline cursor-pointer">Avisos legais</span>
            </div>
            <div className="flex flex-col gap-4">
              <span className="hover:underline cursor-pointer">Central de ajuda</span>
              <span className="hover:underline cursor-pointer">Carreiras</span>
              <span className="hover:underline cursor-pointer">Cookies</span>
            </div>
            <div className="flex flex-col gap-4">
              <span className="hover:underline cursor-pointer">Gift Cards</span>
              <span className="hover:underline cursor-pointer">Termos de uso</span>
              <span className="hover:underline cursor-pointer">Empresa</span>
            </div>
            <div className="flex flex-col gap-4">
              <span className="hover:underline cursor-pointer">Imprensa</span>
              <span className="hover:underline cursor-pointer">Contato</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-white/5">
             <div className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-40">
                © 2024-2025 FASTSHORTS STUDIOS. ALL CLICKS RESERVED.
             </div>
             <button className="border border-gray-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:border-white hover:text-white transition-all">
                CÓDIGO DE SERVIÇO: FS-AI-99X
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
