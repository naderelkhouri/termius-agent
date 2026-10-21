import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TerminalView from './components/TerminalView';
import HostsManager from './components/HostsManager';
import SnippetsManager from './components/SnippetsManager';
import ConversationHistoryModal from './components/ConversationHistoryModal';
import AICopilotModal from './components/AICopilotModal';
import AISidecar from './components/AISidecar';
import SmartCommandBar from './components/SmartCommandBar';
import SkillsDropdownModal from './components/SkillsDropdownModal';
import TelemetryManager from './components/TelemetryManager';
import ErrorBoundary from './components/ErrorBoundary';
import { 
  Plus, 
  X, 
  Menu,
  Sparkles,
  Columns2,
  Rows2,
  Square,
  Pencil,
  RotateCcw,
  ChevronDown,
  Zap,
  PanelRight,
  BookOpen
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('terminals');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [splitMode, setSplitMode] = useState('single'); // 'single' | 'vertical' | 'horizontal'
  const [secondaryTabId, setSecondaryTabId] = useState(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [sidecarOpen, setSidecarOpen] = useState(false);
  const [smartBarOpen, setSmartBarOpen] = useState(true);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const tabMenuRef = useRef(null);

  const [openTabs, setOpenTabs] = useState([
    {
      id: 'tab-default',
      title: 'Localhost (~)',
      cwd: '/home/nader',
      color: '#3fb950',
      host: null
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-default');
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const commandersRef = useRef({});

  // Close tab quick menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tabMenuRef.current && !tabMenuRef.current.contains(e.target)) {
        setTabMenuOpen(false);
      }
    };
    if (tabMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tabMenuOpen]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // Ctrl+K -> AI Copilot
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCopilotOpen(prev => !prev);
      }
      // Ctrl+Alt+V -> Split Vertical
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setSplitMode(prev => prev === 'vertical' ? 'single' : 'vertical');
      }
      // Ctrl+Alt+H -> Split Horizontal
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setSplitMode(prev => prev === 'horizontal' ? 'single' : 'horizontal');
      }
      // Ctrl+Shift+T -> Nova Aba
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleNewTab();
      }
      // Ctrl+Alt+A -> Toggle AI Sidecar
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSidecarOpen(prev => !prev);
      }
      // Ctrl+Space or Ctrl+Shift+P -> Toggle Smart Command Bar
      if ((e.ctrlKey && (e.code === 'Space' || e.key === ' ')) || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setSmartBarOpen(prev => !prev);
      }
      // Ctrl+Shift+S -> Toggle Skills Modal
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSkillsModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [openTabs]);

  const handleAdoptSkillInTerminal = (skillName, skillTitle) => {
    const prompt = `Adote a persona e execute segundo as diretrizes de @${skillName}`;
    handleExecuteCommandInActiveTerminal(prompt, false);
  };

  const handleRegisterCommander = (tabId, commanderFn) => {
    commandersRef.current[tabId] = commanderFn;
  };

  const handleNewTab = (cwd = '/home/nader', title = 'Novo Terminal', host = null, color = '#58a6ff', initialCommand = null, isFluid = false, conversationId = null) => {
    const newId = `tab-${Date.now()}`;
    const newTab = {
      id: newId,
      title: title || (host ? host.label : 'Terminal Local'),
      cwd: cwd || (host ? host.defaultCwd : '/home/nader'),
      color: color || (host ? host.color : '#58a6ff'),
      host,
      isCustomTitle: Boolean(title && title !== 'Novo Terminal'),
      isFluid: Boolean(isFluid),
      conversationId: conversationId || null
    };
    setOpenTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setCurrentView('terminals');
    setMobileMenuOpen(false);

    if (initialCommand) {
      const checkAndRun = (attempts = 15) => {
        const commander = commandersRef.current[newId];
        if (commander) {
          commander(initialCommand);
        } else if (attempts > 0) {
          setTimeout(() => checkAndRun(attempts - 1), 60);
        }
      };
      setTimeout(() => checkAndRun(), 80);
    }
  };

  const handleToggleFluidMode = (tabId) => {
    setOpenTabs((prev) =>
      prev.map((tab) => {
        if (tab.id === tabId) {
          return { ...tab, isFluid: !tab.isFluid };
        }
        return tab;
      })
    );
  };

  const handleResumeConversation = (conversationId, title = 'Conversa Antigravity', cwd = '/home/nader', isFluid = false) => {
    if (!conversationId) return;
    const cleanTitle = title.length > 22 ? `${title.slice(0, 20)}...` : title;
    const flag = isFluid ? ' --dangerously-skip-permissions' : '';
    const color = isFluid ? '#f59e0b' : '#bc8cff';
    handleNewTab(cwd, `IA: ${cleanTitle}`, null, color, `agy --conversation ${conversationId}${flag}`, isFluid, conversationId);
  };

  const handleResumeLastConversation = (isFluid = false) => {
    const flag = isFluid ? ' --dangerously-skip-permissions' : '';
    handleNewTab('/home/nader', 'IA: Antigravity', null, isFluid ? '#f59e0b' : '#bc8cff', `agy --continue${flag}`, isFluid);
  };

  const handleCloseTab = (tabId, e) => {
    if (e) e.stopPropagation();
    if (openTabs.length === 1) {
      alert('Mantenha pelo menos um terminal aberto.');
      return;
    }
    const idx = openTabs.findIndex((t) => t.id === tabId);
    const newTabs = openTabs.filter((t) => t.id !== tabId);
    setOpenTabs(newTabs);
    delete commandersRef.current[tabId];

    if (activeTabId === tabId) {
      const nextIdx = Math.max(0, idx - 1);
      setActiveTabId(newTabs[nextIdx].id);
    }
    if (secondaryTabId === tabId) {
      setSecondaryTabId(null);
    }
  };

  const handleTitleChange = (tabId, rawTitle) => {
    if (!rawTitle) return;
    setOpenTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        // Se o usuário fixou um nome manual, mantém o título customizado
        if (tab.isCustomTitle) {
          return { ...tab, autoTitle: rawTitle };
        }

        let formatted = rawTitle.trim();
        if (formatted.includes(':')) {
          const parts = formatted.split(':');
          const pathOrCmd = parts.slice(1).join(':').trim();
          if (pathOrCmd) {
            const clean = pathOrCmd.replace(/\/$/, '');
            const base = clean.split('/').pop() || clean;
            formatted = base.length > 20 ? `${base.slice(0, 18)}...` : base;
          }
        } else if (formatted.length > 22) {
          formatted = `${formatted.slice(0, 20)}...`;
        }

        return {
          ...tab,
          title: formatted,
          autoTitle: rawTitle
        };
      })
    );
  };

  const handleStartEditTab = (tabId, currentTitle, e) => {
    if (e) e.stopPropagation();
    setEditingTabId(tabId);
    setEditingTitle(currentTitle);
  };

  const handleSaveEditTab = (tabId) => {
    if (editingTabId !== tabId) return;
    const clean = editingTitle.trim();
    setOpenTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        if (clean === '') {
          // Restaurar nome automático
          let restored = 'Terminal';
          if (tab.autoTitle) {
            const trimmed = tab.autoTitle.trim();
            if (trimmed.includes(':')) {
              const base = trimmed.split(':').slice(1).join(':').trim().replace(/\/$/, '').split('/').pop();
              restored = base || 'Terminal';
            } else {
              restored = trimmed;
            }
          } else if (tab.host) {
            restored = tab.host.label;
          }
          return {
            ...tab,
            title: restored,
            isCustomTitle: false
          };
        }
        return {
          ...tab,
          title: clean,
          isCustomTitle: true
        };
      })
    );
    setEditingTabId(null);
  };

  const handleResetAutoTab = (tabId, e) => {
    if (e) e.stopPropagation();
    setOpenTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        let restored = 'Terminal';
        if (tab.autoTitle) {
          const trimmed = tab.autoTitle.trim();
          if (trimmed.includes(':')) {
            const base = trimmed.split(':').slice(1).join(':').trim().replace(/\/$/, '').split('/').pop();
            restored = base || 'Terminal';
          } else {
            restored = trimmed;
          }
        } else if (tab.host) {
          restored = tab.host.label;
        }
        return {
          ...tab,
          title: restored,
          isCustomTitle: false
        };
      })
    );
  };

  const handleExecuteCommandInActiveTerminal = (cmd, execute = true) => {
    if (!cmd) return;
    setCurrentView('terminals');
    setMobileMenuOpen(false);

    if (openTabs.length === 0) {
      handleNewTab();
    }

    const tryExecute = (attemptsLeft = 12) => {
      const targetId = activeTabId || openTabs[0]?.id;
      const commander = commandersRef.current[targetId];
      if (commander) {
        commander(cmd, execute);
      } else if (attemptsLeft > 0) {
        setTimeout(() => tryExecute(attemptsLeft - 1), 60);
      }
    };

    setTimeout(() => tryExecute(), 50);
  };

  const handleConnectHost = (host) => {
    handleNewTab(host.defaultCwd, host.label, host, host.color);
  };

  // Determine effective secondary tab for split screen
  const availableSecondaryTabs = openTabs.filter(t => t.id !== activeTabId);
  const effectiveSecondaryTabId = (secondaryTabId && secondaryTabId !== activeTabId && openTabs.some(t => t.id === secondaryTabId))
    ? secondaryTabId
    : (availableSecondaryTabs[0]?.id || null);

  const activeTab = openTabs.find(t => t.id === activeTabId);
  const activeCwd = activeTab?.cwd || '/home/nader';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d1117] text-slate-100 font-sans">
      {/* Termius Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        openTabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onNewTab={() => handleNewTab()}
        onResumeLastSession={handleResumeLastConversation}
        onOpenSkills={() => setSkillsModalOpen(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
        {/* Top Terminal Tabs Bar */}
        <div className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center px-3 select-none justify-between shrink-0 gap-2 relative">
          {/* Tabs list with overflow mask */}
          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none [mask-image:linear-gradient(to_right,white_calc(100%-16px),transparent)]">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              title="Abrir Menu"
              className="md:hidden w-8 h-8 rounded-lg bg-[#21262d] text-slate-300 hover:text-white flex items-center justify-center shrink-0 active:scale-95"
            >
              <Menu className="w-4 h-4" />
            </button>

            {openTabs.map((tab) => {
              const isActive = tab.id === activeTabId && currentView === 'terminals';
              const isSecondary = splitMode !== 'single' && tab.id === effectiveSecondaryTabId;
              const isEditing = editingTabId === tab.id;

              return (
                <div
                  key={tab.id}
                  onClick={() => {
                    if (!isEditing) {
                      setActiveTabId(tab.id);
                      setCurrentView('terminals');
                    }
                  }}
                  onDoubleClick={(e) => handleStartEditTab(tab.id, tab.title, e)}
                  title={tab.autoTitle ? `Título: ${tab.title} (${tab.autoTitle})\nDuplo clique para renomear` : `${tab.title}\nDuplo clique para renomear`}
                  className={`group min-h-[34px] flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all border shrink-0 ${
                    isActive
                      ? 'bg-[#0d1117] text-white border-blue-500/40 shadow-xs font-bold ring-1 ring-blue-500/30'
                      : isSecondary
                      ? 'bg-[#1c2128] text-blue-300 border-blue-500/30 font-medium'
                      : 'bg-transparent text-slate-300 hover:text-white border-transparent hover:bg-[#21262d] font-medium'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: tab.color || '#3fb950' }}
                  />

                  {isEditing ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEditTab(tab.id);
                        } else if (e.key === 'Escape') {
                          setEditingTabId(null);
                        }
                      }}
                      onBlur={() => handleSaveEditTab(tab.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#161b22] text-white border border-blue-500 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none w-28 sm:w-36"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 max-w-[150px] min-w-0">
                      {tab.isFluid && (
                        <span title="Modo Fluido Ativo: Auto-aprovação de comandos sem confirmação">
                          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 animate-pulse" />
                        </span>
                      )}
                      <span className="truncate whitespace-nowrap">{tab.title}</span>
                      {tab.isCustomTitle && (
                        <button
                          type="button"
                          onClick={(e) => handleResetAutoTab(tab.id, e)}
                          title="Nome manual fixado. Clique para restaurar automático."
                          className="opacity-0 group-hover:opacity-80 hover:!opacity-100 p-0.5 hover:bg-[#30363d] rounded text-blue-400 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleStartEditTab(tab.id, tab.title, e)}
                        title="Renomear aba (ou dê duplo clique)"
                        className="opacity-0 group-hover:opacity-70 hover:!opacity-100 p-0.5 hover:bg-[#30363d] rounded text-slate-400 hover:text-blue-300 transition-opacity"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="opacity-70 group-hover:opacity-100 p-1 hover:bg-[#30363d] rounded-md text-slate-400 hover:text-white transition-opacity"
                    title="Fechar aba"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => handleNewTab()}
              title="Nova Aba de Terminal (Ctrl+Shift+T)"
              className="w-8 h-8 rounded-xl text-slate-300 hover:text-white hover:bg-[#21262d] flex items-center justify-center transition-colors shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Tab Selector Dropdown */}
          <div className="relative shrink-0" ref={tabMenuRef}>
            <button
              onClick={() => setTabMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white text-xs font-semibold transition-all border border-[#30363d] active:scale-95"
              title="Lista rápida de abas abertas"
            >
              <span>{openTabs.length}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${tabMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {tabMenuOpen && (
              <div className="absolute right-0 top-11 w-64 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl z-50 py-2 divide-y divide-[#30363d]/60">
                <div className="px-3.5 py-2 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Abas Abertas ({openTabs.length})</span>
                  <button
                    onClick={() => {
                      handleNewTab();
                      setTabMenuOpen(false);
                    }}
                    className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 lowercase"
                  >
                    <Plus className="w-3 h-3" />
                    <span>nova</span>
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {openTabs.map((t) => {
                    const isTabActive = t.id === activeTabId;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setActiveTabId(t.id);
                          setCurrentView('terminals');
                          setTabMenuOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 flex items-center justify-between text-xs hover:bg-[#21262d] cursor-pointer transition-colors ${
                          isTabActive ? 'bg-blue-600/10 text-white font-bold' : 'text-slate-300 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.color || '#3fb950' }}
                          />
                          <span className="truncate">{t.title}</span>
                          {isTabActive && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                              Foco
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseTab(t.id, e);
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#30363d] text-slate-400 hover:text-rose-400 shrink-0"
                          title="Fechar aba"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Top Actions: Modo Fluido, AI Copilot & Split Screen Controls */}
          <div className="flex items-center gap-2 pr-1 shrink-0">
            {/* Modo Fluido Toggle */}
            {currentView === 'terminals' && (
              <button
                type="button"
                onClick={() => handleToggleFluidMode(activeTabId)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs active:scale-95 ${
                  activeTab?.isFluid
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/10'
                    : 'bg-[#21262d] text-slate-400 border-[#30363d] hover:text-slate-200 hover:bg-[#30363d]'
                }`}
                title="Modo Fluido: Auto-aprovação de confirmações do Antigravity ('Run this command? 1. Yes...')"
              >
                <Zap className={`w-3.5 h-3.5 ${activeTab?.isFluid ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Modo Fluido</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                  activeTab?.isFluid ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 font-bold' : 'bg-[#161b22] text-slate-500 border-[#30363d]'
                }`}>
                  {activeTab?.isFluid ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {/* Skills IA Catalog Button */}
            <button
              type="button"
              onClick={() => setSkillsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all shadow-xs active:scale-95"
              title="Catálogo de Skills & Especialistas IA em Português BR (Ctrl + Shift + S)"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Skills IA</span>
              <span className="text-[10px] font-mono px-1 rounded bg-purple-500/25 text-purple-300">340</span>
            </button>

            {/* AI Copilot Button */}
            <button
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all shadow-xs active:scale-95"
              title="AI Copilot (Ctrl + K)"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="hidden sm:inline">AI Copilot</span>
              <span className="text-xs font-mono opacity-75 hidden md:inline">Ctrl+K</span>
            </button>

            {/* Smart Command Bar Toggle */}
            {currentView === 'terminals' && (
              <button
                type="button"
                onClick={() => setSmartBarOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs active:scale-95 ${
                  smartBarOpen
                    ? 'bg-purple-600/20 text-purple-200 border-purple-500/50 shadow-purple-500/10'
                    : 'bg-[#21262d] text-slate-400 border-[#30363d] hover:text-slate-200 hover:bg-[#30363d]'
                }`}
                title="Smart Command Bar: Autocomplete contextual e preditivo (Ctrl + Espaço)"
              >
                <Sparkles className={`w-3.5 h-3.5 ${smartBarOpen ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Smart Bar</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                  smartBarOpen ? 'bg-purple-500/30 text-purple-300 border-purple-500/50 font-bold' : 'bg-[#161b22] text-slate-500 border-[#30363d]'
                }`}>
                  {smartBarOpen ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {/* AI Sidecar Toggle */}
            {currentView === 'terminals' && (
              <button
                type="button"
                onClick={() => setSidecarOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs active:scale-95 ${
                  sidecarOpen
                    ? 'bg-purple-600/25 text-purple-200 border-purple-500/50 shadow-purple-500/10'
                    : 'bg-[#21262d] text-slate-400 border-[#30363d] hover:text-slate-200 hover:bg-[#30363d]'
                }`}
                title="AI Sidecar: Acompanhe passos, raciocínio, comandos e diffs ao vivo (Ctrl + Alt + A)"
              >
                <PanelRight className={`w-3.5 h-3.5 ${sidecarOpen ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">AI Sidecar</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                  sidecarOpen ? 'bg-purple-500/30 text-purple-300 border-purple-500/50 font-bold' : 'bg-[#161b22] text-slate-500 border-[#30363d]'
                }`}>
                  {sidecarOpen ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {/* Split Screen Mode Buttons */}
            {currentView === 'terminals' && (
              <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-[#30363d] gap-1">
                <button
                  onClick={() => setSplitMode('single')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95 ${
                    splitMode === 'single'
                      ? 'bg-[#21262d] text-blue-400 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tela Cheia (1 Terminal)"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (openTabs.length < 2) handleNewTab();
                    setSplitMode('vertical');
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95 ${
                    splitMode === 'vertical'
                      ? 'bg-[#21262d] text-blue-400 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Dividir Verticalmente (Ctrl + Alt + V)"
                >
                  <Columns2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (openTabs.length < 2) handleNewTab();
                    setSplitMode('horizontal');
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95 ${
                    splitMode === 'horizontal'
                      ? 'bg-[#21262d] text-blue-400 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Dividir Horizontalmente (Ctrl + Alt + H)"
                >
                  <Rows2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic View Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Terminals (Multiplexed with Split Panes or Single View + Docked AI Sidecar) */}
          <div className={`h-full w-full ${currentView === 'terminals' ? 'flex overflow-hidden' : 'hidden'}`}>
            {/* Terminal Main Grid/Pane */}
            <div className="flex-1 h-full min-w-0 relative flex flex-col">
              <div className={`flex-1 min-h-0 w-full ${
                splitMode === 'vertical' && effectiveSecondaryTabId
                  ? 'grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#30363d]'
                  : splitMode === 'horizontal' && effectiveSecondaryTabId
                  ? 'grid grid-rows-2 divide-y divide-[#30363d]'
                  : 'relative'
              }`}>
                {openTabs.map((tab) => {
                  const isPrimary = tab.id === activeTabId;
                  const isSecondary = splitMode !== 'single' && tab.id === effectiveSecondaryTabId;
                  const isVisible = (isPrimary || isSecondary) && currentView === 'terminals';
                  const isSplit = splitMode !== 'single';

                  return (
                    <div
                      key={tab.id}
                      onClick={() => {
                        if (activeTabId !== tab.id) setActiveTabId(tab.id);
                      }}
                      className={`h-full w-full relative flex flex-col transition-all duration-150 ${
                        isVisible ? 'flex' : 'hidden'
                      } ${
                        isSplit && isPrimary 
                          ? 'ring-1 ring-blue-500/80 shadow-[0_0_16px_rgba(56,139,253,0.18)] z-10' 
                          : isSplit 
                          ? 'opacity-85 hover:opacity-100' 
                          : ''
                      }`}
                    >
                      {/* Header bar inside split pane */}
                      {isSplit && isVisible && (
                        <div className={`h-8 px-3 flex items-center justify-between text-xs shrink-0 select-none transition-colors ${
                          isPrimary
                            ? 'bg-[#1c2128] border-b border-blue-500/40 text-blue-300'
                            : 'bg-[#161b22] border-b border-[#30363d] text-slate-400'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                isPrimary ? 'bg-blue-500 ring-2 ring-blue-400/40' : 'bg-slate-500'
                              }`} 
                            />
                            <span 
                              onDoubleClick={(e) => handleStartEditTab(tab.id, tab.title, e)}
                              className={`font-semibold truncate max-w-[150px] cursor-pointer hover:text-blue-300 transition-colors ${isPrimary ? 'text-blue-200 font-bold' : 'text-slate-400'}`}
                              title="Duplo clique para renomear"
                            >
                              {tab.title}
                            </span>
                            {tab.isCustomTitle && (
                              <span className="text-[10px] text-blue-300/80 font-mono px-1 rounded bg-blue-500/10 border border-blue-500/20">
                                editado
                              </span>
                            )}
                            {isPrimary && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/30 shrink-0">
                                Foco
                              </span>
                            )}
                          </div>

                          {isSecondary && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-slate-400 text-xs font-medium">Aba:</span>
                              <select
                                value={effectiveSecondaryTabId}
                                onChange={(e) => setSecondaryTabId(e.target.value)}
                                className="bg-[#0d1117] text-slate-300 border border-[#30363d] rounded-lg px-2 py-0.5 text-xs focus:outline-none"
                              >
                                {openTabs.filter(t => t.id !== activeTabId).map(t => (
                                  <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Terminal View Container */}
                      <div className="flex-1 min-h-0 relative">
                        <ErrorBoundary>
                          <TerminalView
                            tab={tab}
                            isActive={isVisible}
                            onTitleChange={handleTitleChange}
                            onRegisterCommander={handleRegisterCommander}
                          />
                        </ErrorBoundary>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Smart Command Bar (Autocomplete Preditivo Contextual) */}
              {smartBarOpen && (
                <ErrorBoundary>
                  <SmartCommandBar
                    cwd={activeCwd}
                    onExecuteCommand={(cmd) => handleExecuteCommandInActiveTerminal(cmd, true)}
                    onInjectCommand={(cmd) => handleExecuteCommandInActiveTerminal(cmd, false)}
                    isOpen={smartBarOpen}
                    onToggle={() => setSmartBarOpen((prev) => !prev)}
                  />
                </ErrorBoundary>
              )}
            </div>

            {/* Live Docked AI Sidecar Panel */}
            {sidecarOpen && (
              <div className="w-[380px] lg:w-[440px] xl:w-[480px] h-full shrink-0 z-20 flex flex-col">
                <ErrorBoundary>
                  <AISidecar
                    activeTab={activeTab}
                    onClose={() => setSidecarOpen(false)}
                    onExecuteCommand={handleExecuteCommandInActiveTerminal}
                    onResumeConversation={handleResumeConversation}
                  />
                </ErrorBoundary>
              </div>
            )}
          </div>

          {/* Hosts View */}
          {currentView === 'hosts' && (
            <HostsManager onConnectHost={handleConnectHost} />
          )}

          {/* Snippets View */}
          {currentView === 'snippets' && (
            <SnippetsManager onExecuteSnippet={handleExecuteCommandInActiveTerminal} />
          )}

          {/* Conversations IA View */}
          {currentView === 'conversations' && (
            <ConversationHistoryModal
              onExecuteCommand={handleExecuteCommandInActiveTerminal}
              onOpenProjectTerminal={(path, name) => handleNewTab(path, name)}
              onResumeConversation={handleResumeConversation}
            />
          )}

          {/* Telemetry & Continuous Improvement View */}
          {currentView === 'telemetry' && (
            <TelemetryManager />
          )}
        </div>

        {/* AI Copilot Floating Modal (Ctrl + K) */}
        <AICopilotModal
          isOpen={copilotOpen}
          onClose={() => setCopilotOpen(false)}
          onExecuteCommand={handleExecuteCommandInActiveTerminal}
          currentCwd={activeCwd}
        />

        {/* Skills Catalog & Directives Modal (Ctrl + Shift + S) */}
        <SkillsDropdownModal
          isOpen={skillsModalOpen}
          onClose={() => setSkillsModalOpen(false)}
          onAdoptSkillInTerminal={handleAdoptSkillInTerminal}
        />
      </main>
    </div>
  );
}
