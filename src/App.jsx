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
  Square
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

  const handleNewTab = (cwd = '/home/nader', title = 'Novo Terminal', host = null, color = '#58a6ff') => {
    const newId = `tab-${Date.now()}`;
    const newTab = {
      id: newId,
      title: title || (host ? host.label : 'Terminal Local'),
      cwd: cwd || (host ? host.defaultCwd : '/home/nader'),
      color: color || (host ? host.color : '#58a6ff'),
      host
    };
    setOpenTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setCurrentView('terminals');
    setMobileMenuOpen(false);
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

  const handleExecuteCommandInActiveTerminal = (cmd) => {
    if (!cmd) return;
    setCurrentView('terminals');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const commander = commandersRef.current[activeTabId];
      if (commander) {
        commander(cmd);
      } else {
        alert('Nenhum terminal ativo para executar o comando.');
      }
    }, 100);
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
              return (
                <div
                  key={tab.id}
                  onClick={() => {
                    setActiveTabId(tab.id);
                    setCurrentView('terminals');
                  }}
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
                  <span className="truncate max-w-[140px] whitespace-nowrap">{tab.title}</span>
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="opacity-70 group-hover:opacity-100 p-1 hover:bg-[#30363d] rounded-md text-slate-400 hover:text-white transition-opacity"
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
                          <span className={`font-semibold truncate max-w-[150px] ${isPrimary ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}>
                            {tab.title}
                          </span>
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
