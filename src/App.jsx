import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TerminalView from './components/TerminalView';
import HostsManager from './components/HostsManager';
import SnippetsManager from './components/SnippetsManager';
import ConversationHistoryModal from './components/ConversationHistoryModal';
import AICopilotModal from './components/AICopilotModal';
import TelemetryManager from './components/TelemetryManager';
import { 
  Plus, 
  X, 
  Menu,
  Sparkles,
  Columns2,
  Rows2,
  Square,
  Pencil,
  RotateCcw
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('terminals');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [splitMode, setSplitMode] = useState('single'); // 'single' | 'vertical' | 'horizontal'
  const [secondaryTabId, setSecondaryTabId] = useState(null);
  const [copilotOpen, setCopilotOpen] = useState(false);

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
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [openTabs]);

  const handleRegisterCommander = (tabId, commanderFn) => {
    commandersRef.current[tabId] = commanderFn;
  };

  const handleNewTab = (cwd = '/home/nader', title = 'Novo Terminal', host = null, color = '#58a6ff', initialCommand = null) => {
    const newId = `tab-${Date.now()}`;
    const newTab = {
      id: newId,
      title: title || (host ? host.label : 'Terminal Local'),
      cwd: cwd || (host ? host.defaultCwd : '/home/nader'),
      color: color || (host ? host.color : '#58a6ff'),
      host,
      isCustomTitle: Boolean(title && title !== 'Novo Terminal')
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

  const handleResumeConversation = (conversationId, title = 'Conversa Antigravity', cwd = '/home/nader') => {
    if (!conversationId) return;
    const cleanTitle = title.length > 22 ? `${title.slice(0, 20)}...` : title;
    handleNewTab(cwd, `IA: ${cleanTitle}`, null, '#bc8cff', `agy --conversation ${conversationId}`);
  };

  const handleResumeLastConversation = () => {
    handleNewTab('/home/nader', 'IA: Antigravity', null, '#bc8cff', 'agy --continue');
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

  const handleExecuteCommandInActiveTerminal = (cmd) => {
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
        commander(cmd);
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

  const activeCwd = openTabs.find(t => t.id === activeTabId)?.cwd || '/home/nader';

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
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
        {/* Top Terminal Tabs Bar */}
        <div className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center px-3 select-none justify-between overflow-x-auto shrink-0 gap-2">
          {/* Tabs list */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
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
                      ? 'bg-[#0d1117] text-white border-[#30363d] shadow-xs font-bold'
                      : isSecondary
                      ? 'bg-[#1c2128] text-cyan-300 border-cyan-500/30 font-medium'
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
                      className="bg-[#161b22] text-white border border-cyan-500 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none w-28 sm:w-36"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 max-w-[150px] min-w-0">
                      <span className="truncate whitespace-nowrap">{tab.title}</span>
                      {tab.isCustomTitle && (
                        <button
                          type="button"
                          onClick={(e) => handleResetAutoTab(tab.id, e)}
                          title="Nome manual fixado. Clique para restaurar automático."
                          className="opacity-0 group-hover:opacity-80 hover:!opacity-100 p-0.5 hover:bg-[#30363d] rounded text-cyan-400 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleStartEditTab(tab.id, tab.title, e)}
                        title="Renomear aba (ou dê duplo clique)"
                        className="opacity-0 group-hover:opacity-70 hover:!opacity-100 p-0.5 hover:bg-[#30363d] rounded text-slate-400 hover:text-cyan-300 transition-opacity"
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

          {/* Top Actions: AI Copilot & Split Screen Controls */}
          <div className="flex items-center gap-2 pr-1 shrink-0">
            {/* AI Copilot Button */}
            <button
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all shadow-xs active:scale-95"
              title="AI Copilot (Ctrl + K)"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="hidden sm:inline">AI Copilot</span>
              <span className="text-xs font-mono opacity-75 hidden md:inline">Ctrl+K</span>
            </button>

            {/* Split Screen Mode Buttons */}
            {currentView === 'terminals' && (
              <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-[#30363d] gap-1">
                <button
                  onClick={() => setSplitMode('single')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95 ${
                    splitMode === 'single'
                      ? 'bg-[#21262d] text-cyan-400 shadow-xs'
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
                      ? 'bg-[#21262d] text-cyan-400 shadow-xs'
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
                      ? 'bg-[#21262d] text-cyan-400 shadow-xs'
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
          {/* Terminals (Multiplexed with Split Panes or Single View) */}
          <div className={`h-full w-full ${currentView === 'terminals' ? 'block' : 'hidden'}`}>
            <div className={`h-full w-full ${
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

                return (
                  <div
                    key={tab.id}
                    onClick={() => {
                      if (activeTabId !== tab.id) setActiveTabId(tab.id);
                    }}
                    className={`h-full w-full relative flex flex-col ${isVisible ? 'flex' : 'hidden'}`}
                  >
                    {/* Header bar inside split pane */}
                    {splitMode !== 'single' && isVisible && (
                      <div className="h-8 px-3 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between text-xs shrink-0 select-none">
                        <div className="flex items-center gap-2 min-w-0">
                          <span 
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isPrimary ? 'bg-cyan-400 ring-2 ring-cyan-400/30' : 'bg-slate-500'
                            }`} 
                          />
                          <span 
                            onDoubleClick={(e) => handleStartEditTab(tab.id, tab.title, e)}
                            className={`font-semibold truncate max-w-[150px] cursor-pointer hover:text-cyan-300 transition-colors ${isPrimary ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}
                            title="Duplo clique para renomear"
                          >
                            {tab.title}
                          </span>
                          {tab.isCustomTitle && (
                            <span className="text-[10px] text-cyan-400/80 font-mono px-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                              editado
                            </span>
                          )}
                          {isPrimary && (
                            <span className="text-xs bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-500/30 shrink-0">
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
                      <TerminalView
                        tab={tab}
                        isActive={isVisible}
                        onTitleChange={handleTitleChange}
                        onRegisterCommander={handleRegisterCommander}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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
      </main>
    </div>
  );
}
