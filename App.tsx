import React from 'react';
import { LeadFinder } from './components/LeadFinder';
import { Target, Map, Database, Settings, Zap, Compass, Info } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-[#09090b] flex text-zinc-100 selection:bg-emerald-500/20">
      
      {/* Sidebar - Modern Dark Style */}
      <aside className="w-72 border-r border-zinc-800/50 bg-[#09090b] hidden lg:flex flex-col fixed h-full z-20">
        <div className="h-20 flex items-center px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="h-6 w-6 text-black fill-black" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white leading-none">LeadEngine</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-1">Bangladesh Pro</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1.5">
          <div className="text-[10px] font-bold text-zinc-600 px-4 mb-2 uppercase tracking-widest">Main Menu</div>
          
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-medium transition-all group">
            <Compass size={20} className="group-hover:scale-110 transition-transform" />
            Lead Explorer
          </a>
          
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-xl transition-all group">
            <Database size={20} className="group-hover:scale-110 transition-transform" />
            Managed Lists
            <span className="ml-auto bg-zinc-800 text-zinc-400 text-[10px] py-0.5 px-2 rounded-lg font-bold">PRO</span>
          </a>
          
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-xl transition-all group">
            <Settings size={20} className="group-hover:scale-110 transition-transform" />
            API Gateway
          </a>

          <div className="pt-8 text-[10px] font-bold text-zinc-600 px-4 mb-2 uppercase tracking-widest">Resources</div>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-xl transition-all">
            <Info size={20} />
            Documentation
          </a>
        </nav>

        <div className="p-6">
          <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap size={40} className="text-emerald-500" />
            </div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-3">Usage Statistics</p>
            <div className="flex items-end justify-between mb-4">
              <div>
                <span className="text-2xl font-bold text-white">12</span>
                <span className="text-zinc-500 text-sm ml-1">/ 500</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md font-bold uppercase">Free</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[24%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            </div>
            <button className="w-full mt-4 py-2 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors">
              Upgrade to Premium
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden h-20 border-b border-zinc-800/50 flex items-center px-6 justify-between bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-black fill-black" />
            </div>
            <span className="font-bold text-lg text-white">LeadEngine</span>
          </div>
          <button className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-xl border border-zinc-800">
            <Settings size={20} />
          </button>
        </div>

        {/* Header/Breadcrumbs */}
        <div className="px-6 md:px-10 pt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="animate-slide-in">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-2 uppercase tracking-widest">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-emerald-400">Extractor</span>
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">Lead Extraction</h1>
              <p className="text-zinc-500 mt-2 max-w-lg text-sm leading-relaxed">
                Harness localized data points across Bangladesh's administrative divisions with hyper-granular precision.
              </p>
            </div>
          </div>
          
          <div className="animate-slide-in [animation-delay:100ms]">
            <LeadFinder />
          </div>
        </div>
        
        <footer className="p-10 mt-auto border-t border-zinc-800/30 text-center">
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em]">BD LeadEngine &copy; 2024 • Powered by Serper</p>
        </footer>
      </main>
    </div>
  );
}

export default App;