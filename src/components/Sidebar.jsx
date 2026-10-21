import React from 'react';
import { 
  Server, 
  Terminal, 
  Code2, 
  BotMessageSquare, 
  Plus, 
  Layers,
  Sparkles,
  X,
  Activity,
  Zap
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  setCurrentView, 
  openTabs, 
  activeTabId, 
  onSelectTab, 
  onNewTab,
  onResumeLastSession,
  onOpenSkills,
  mobileOpen,
  onCloseMobile
}) {
  const navItems = [
    { id: 'terminals', label: 'Terminais', icon: Terminal, count: openTabs.length },
    { id: 'hosts', label: 'Hosts & SSH', icon: Server },
    { id: 'snippets', label: 'Snippets', icon: Code2 },
    { id: 'conversations', label: 'Histórico IA', icon: BotMessageSquare, highlight: true },
    { id: 'telemetry', label: 'Telemetria & Bugs', icon: Activity },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-72 bg-[#161b22] border-r border-[#30363d] 
        flex flex-col justify-between shrink-0 select-none
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top Header */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#30363d]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-500/30 shrink-0">
                <img src="/icon.png" alt="Termius Agent Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-wide text-white block leading-tight">TERMIUS</span>
                <span className="text-xs text-cyan-400 font-semibold tracking-wider uppercase block">Agent Suite</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={onNewTab}
                title="Novo Terminal Local"
                className="w-9 h-9 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Close button on mobile */}
              <button 
                onClick={onCloseMobile}
                title="Fechar Menu"
                className="md:hidden w-9 h-9 rounded-lg bg-[#21262d] text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="p-3 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
              Navegação
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-xs' 
                      : 'text-slate-300 hover:text-white hover:bg-[#21262d]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-[#30363d] text-slate-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="flex h-2.5 w-2.5 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Terminal Tabs Quick List */}
          {openTabs.length > 0 && (
            <div className="px-3 pt-3 border-t border-[#30363d]">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sessões Ativas
                </span>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {openTabs.map((tab) => {
                  const isSelected = activeTabId === tab.id && currentView === 'terminals';
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onSelectTab(tab.id);
                        setCurrentView('terminals');
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full min-h-[38px] text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs truncate transition-all ${
                        isSelected
                          ? 'bg-[#21262d] text-cyan-400 font-bold border border-cyan-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-[#21262d]/50 font-medium'
                      }`}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                        style={{ backgroundColor: tab.color || '#3fb950' }} 
                      />
                      <span className="truncate whitespace-nowrap">{tab.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Resume Antigravity Banner & Skills IA */}
        <div className="p-3 border-t border-[#30363d]/60 space-y-2">
          {onOpenSkills && (
            <button
              onClick={() => {
                onOpenSkills();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all shadow-xs active:scale-95 group"
              title="Catálogo de 340 Skills & Especialistas em Português BR"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform animate-pulse" />
                <span>Skills IA (340)</span>
              </div>
              <span className="text-xs bg-purple-500/30 text-purple-300 font-mono font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
                PT-BR
              </span>
            </button>
          )}

          <button
            onClick={() => {
              if (onResumeLastSession) onResumeLastSession();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all shadow-xs active:scale-95 group"
            title="Retomar a conversa mais recente do Antigravity CLI com 1 clique (agy --continue)"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform" />
              <span>Retomar Última IA</span>
            </div>
            <span className="text-xs bg-purple-500/30 text-purple-300 font-mono font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
              agy -c
            </span>
          </button>
        </div>

        {/* Footer / Agent Status */}
        <div className="p-3 border-t border-[#30363d] bg-[#0d1117]/60 safe-area-bottom">
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#21262d]/70 border border-[#30363d]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-slate-200 font-semibold text-xs whitespace-nowrap">Agente Ativo</span>
            </div>
            <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-md font-mono whitespace-nowrap">
              Antigravity
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
