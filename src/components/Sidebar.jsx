import React, { useState } from 'react';
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
  Zap, 
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Target,
  Columns,
  Sliders,
  SlidersHorizontal,
  FolderTree
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
  onOpenShortcuts,
  mobileOpen,
  onCloseMobile,
  workMode = 'expansivo',
  setWorkMode,
  sidebarWidth = 280,
  setSidebarWidth,
  isCollapsed = false,
  onToggleCollapse,
  visible = true,
  showActiveSessions = true,
  showAiBanners = true,
  onOpenCustomModal
}) {
  const [isResizing, setIsResizing] = useState(false);

  // Se a barra estiver oculta e o menu mobile não estiver aberto, não renderiza
  if (!visible && !mobileOpen) return null;

  // Consideramos modo compacto quando colapsado ou quando a largura for menor que 90px
  const isCompact = isCollapsed || workMode === 'foco' || sidebarWidth <= 90;

  const navItems = [
    { id: 'terminals', label: 'Terminais', icon: Terminal, count: openTabs.length },
    { id: 'hosts', label: 'Hosts & SSH', icon: Server },
    { id: 'files', label: 'Arquivos & SFTP', icon: FolderTree },
    { id: 'snippets', label: 'Snippets', icon: Code2 },
    { id: 'conversations', label: 'Histórico IA', icon: BotMessageSquare, highlight: true },
    { id: 'telemetry', label: 'Telemetria & Bugs', icon: Activity },
  ];

  const handleMouseDown = (e) => {
    if (workMode !== 'personalizado') return;
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent) => {
      // Limites de largura: mínimo 64px, máximo 550px
      const newWidth = Math.min(550, Math.max(64, moveEvent.clientX));
      if (setSidebarWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside 
        style={{ width: isCompact ? '64px' : `${sidebarWidth}px` }}
        className={`
          fixed md:static inset-y-0 left-0 z-50
          bg-[#161b22] border-r border-[#30363d] 
          flex flex-col justify-between shrink-0 select-none relative
          ${isResizing ? 'select-none transition-none' : 'transition-all duration-200 ease-out'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Top Header */}
        <div className="flex flex-col min-w-0">
          <div className={`h-16 flex items-center justify-between border-b border-[#30363d] ${isCompact ? 'px-2 flex-col justify-center gap-1.5' : 'px-3.5'}`}>
            {!isCompact ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-500/30 shrink-0">
                  <img src="/icon.png" alt="Termius Agent Logo" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 truncate">
                  <span className="font-bold text-xs tracking-wide text-white block leading-tight truncate">TERMIUS</span>
                  <span className="text-xs text-cyan-400 font-bold tracking-wider uppercase block truncate">Agent Suite</span>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-500/30 shrink-0" title="Termius Agent Suite">
                <img src="/icon.png" alt="Termius Agent Logo" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={onNewTab}
                title="Novo Terminal Local (Ctrl+Shift+T)"
                className="w-7 h-7 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {/* Toggle Collapse/Expand button */}
              <button 
                onClick={onToggleCollapse}
                title={isCompact ? "Expandir coluna lateral (Ctrl + B)" : "Recuar coluna lateral (Ctrl + B)"}
                className="w-7 h-7 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-400 hover:text-white hidden md:flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
              >
                {isCompact ? <PanelLeftOpen className="w-3.5 h-3.5 text-blue-400" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
              </button>

              {/* Close button on mobile */}
              <button 
                onClick={onCloseMobile}
                title="Fechar Menu"
                className="md:hidden w-7 h-7 rounded-lg bg-[#21262d] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3 Modos de Trabalho: FOCO | Expansivo | Personalizado */}
          {!isCompact ? (
            <div className="px-3 pt-2.5 pb-1">
              <div className="p-1 bg-[#0d1117] rounded-xl border border-[#30363d]/80 flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setWorkMode && setWorkMode('foco')}
                  className={`flex-1 py-1 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    workMode === 'foco'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                  }`}
                  title="Modo FOCO: Apenas terminais (oculta barras e menus para foco total)"
                >
                  <Target className="w-3 h-3 text-cyan-300 shrink-0" />
                  <span className="text-xs font-semibold truncate">FOCO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkMode && setWorkMode('expansivo')}
                  className={`flex-1 py-1 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    workMode === 'expansivo'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                  }`}
                  title="Modo Expansivo: Todas as opções, barras e ferramentas à mostra"
                >
                  <Columns className="w-3 h-3 text-blue-300 shrink-0" />
                  <span className="text-xs font-semibold truncate">Expansivo</span>
                </button>

                <div className="flex-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => setWorkMode && setWorkMode('personalizado')}
                    className={`flex-1 py-1 px-1 rounded-l-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      workMode === 'personalizado'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                    }`}
                    title="Modo Custom: Configurado pelo menu multiseletor"
                  >
                    <Sliders className="w-3 h-3 text-amber-300 shrink-0" />
                    <span className="text-xs font-semibold truncate">Custom</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenCustomModal && onOpenCustomModal()}
                    className={`p-1 rounded-r-lg border-l border-[#30363d] transition-colors cursor-pointer ${
                      workMode === 'personalizado'
                        ? 'bg-amber-600/80 hover:bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-amber-300 hover:bg-[#21262d]'
                    }`}
                    title="Abrir Multiseletor do Modo Custom"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-2 border-b border-[#30363d]/60">
              <button
                type="button"
                onClick={() => setWorkMode && setWorkMode('foco')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  workMode === 'foco' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                }`}
                title="Modo FOCO: Apenas terminais"
              >
                <Target className="w-4 h-4 text-cyan-300" />
              </button>
              <button
                type="button"
                onClick={() => setWorkMode && setWorkMode('expansivo')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  workMode === 'expansivo' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                }`}
                title="Modo Expansivo: Todas as opções à mostra (280px)"
              >
                <Columns className="w-4 h-4 text-blue-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkMode && setWorkMode('personalizado');
                  onOpenCustomModal && onOpenCustomModal();
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  workMode === 'personalizado' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                }`}
                title="Modo Custom: Configurar no menu multiseletor"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          )}

          {/* Navigation Sections */}
          <div className={`${isCompact ? 'p-1.5 space-y-2' : 'p-3 space-y-1.5'}`}>
            {!isCompact && (
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Navegação
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              if (isCompact) {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`relative w-10 h-10 mx-auto flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-xs' 
                        : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                    }`}
                    title={`${item.label}${item.count !== undefined ? ` (${item.count})` : ''}`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    {item.count !== undefined && item.count > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-xs font-mono font-bold flex items-center justify-center leading-none shadow-xs">
                        {item.count}
                      </span>
                    )}
                    {item.highlight && (
                      <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-xs' 
                      : 'text-slate-300 hover:text-white hover:bg-[#21262d]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap truncate">{item.label}</span>
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
          {showActiveSessions && !isCompact && openTabs.length > 0 && (
            <div className="pt-2.5 border-t border-[#30363d] px-3">
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sessões ({openTabs.length})
                </span>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
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
                      className={`w-full min-h-[36px] text-left flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs truncate transition-all cursor-pointer ${
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

        {/* Bottom Actions: Quick Resume Antigravity Banner & Skills IA */}
        <div className="flex flex-col">
          {showAiBanners && (
            <div className={`border-t border-[#30363d]/60 ${isCompact ? 'p-2 space-y-2 flex flex-col items-center' : 'p-3 space-y-2'}`}>
              {onOpenSkills && (
                isCompact ? (
                  <button
                    onClick={() => {
                      onOpenSkills();
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="w-10 h-10 rounded-xl bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                    title="Catálogo de 340 Skills & Especialistas IA"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onOpenSkills();
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all shadow-xs active:scale-95 group cursor-pointer"
                    title="Catálogo de 340 Skills & Especialistas em Português BR"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform animate-pulse shrink-0" />
                      <span className="truncate">Skills IA (340)</span>
                    </div>
                    <span className="text-xs bg-purple-500/30 text-purple-300 font-mono font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
                      PT-BR
                    </span>
                  </button>
                )
              )}

              {isCompact ? (
                <button
                  onClick={() => {
                    if (onResumeLastSession) onResumeLastSession();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-10 h-10 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 text-purple-200 flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                  title="Retomar a conversa mais recente do Antigravity CLI com 1 clique (agy --continue)"
                >
                  <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (onResumeLastSession) onResumeLastSession();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all shadow-xs active:scale-95 group cursor-pointer"
                  title="Retomar a conversa mais recente do Antigravity CLI com 1 clique (agy --continue)"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate">Retomar Última IA</span>
                  </div>
                  <span className="text-xs bg-purple-500/30 text-purple-300 font-mono font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
                    agy -c
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Footer / Shortcuts */}
          {onOpenShortcuts && (
            <div className={`border-t border-[#30363d] bg-[#0d1117]/60 safe-area-bottom ${isCompact ? 'p-2 flex flex-col items-center' : 'p-3'}`}>
              {isCompact ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenShortcuts();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-10 h-10 rounded-xl bg-[#21262d]/60 hover:bg-[#21262d] border border-[#30363d] text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  title="Central de Atalhos de Teclado (F1 ou ?)"
                >
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenShortcuts();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#21262d]/60 hover:bg-[#21262d] border border-[#30363d] text-slate-300 hover:text-white text-xs font-semibold transition-all active:scale-95 group cursor-pointer"
                  title="Central de Atalhos de Teclado (F1 ou ?)"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate">Atalhos de Teclado</span>
                  </div>
                  <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-[#161b22] text-slate-400 border border-[#30363d]">
                    F1
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Drag Resizer Handle for Modo Personalizado */}
        {workMode === 'personalizado' && !isCompact && (
          <div
            onMouseDown={handleMouseDown}
            className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500/70 transition-colors z-50 ${
              isResizing ? 'bg-blue-500 w-2.5 shadow-lg shadow-blue-500/50' : 'bg-transparent'
            }`}
            title="Arraste para redimensionar a largura da coluna esquerda (Personalizado)"
          />
        )}
      </aside>
    </>
  );
}
