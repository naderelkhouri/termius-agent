import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import SessionReplayModal from './components/SessionReplayModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import TerminalThemeModal from './components/TerminalThemeModal';
import CustomWorkModeModal from './components/CustomWorkModeModal';
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
  ChevronLeft, 
  ChevronRight, 
  MousePointer, 
  ArrowLeftRight, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Target, 
  Columns, 
  Sliders, 
  Zap, 
  PanelRight, 
  BookOpen, 
  Bell, 
  BellOff, 
  Film, 
  Circle, 
  Radio, 
  CheckSquare, 
  Layers, 
  SlidersHorizontal, 
  HelpCircle, 
  Palette,
  Terminal,
  Server,
  Folder,
  Copy,
  Check
} from 'lucide-react';
import { copyToClipboard } from './services/clipboardService';
import { 
  isNotificationEnabled, 
  setNotificationEnabled, 
  requestNotificationPermission, 
  playNotificationSound 
} from './services/notificationService';
import { startRecording, stopRecording, isRecording } from './services/sessionRecorder';
import { 
  loadTerminalSettings, 
  saveTerminalSettings, 
  DEFAULT_TERMINAL_SETTINGS, 
  TERMINAL_THEMES 
} from './services/terminalThemes';

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(isNotificationEnabled);
  const [recordingTabId, setRecordingTabId] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [replayRecording, setReplayRecording] = useState(null);
  const [replayModalOpen, setReplayModalOpen] = useState(false);
  const [broadcastEnabled, setBroadcastEnabled] = useState(false);
  const [broadcastTargetIds, setBroadcastTargetIds] = useState([]); // [] = todas as abas abertas
  const [broadcastMenuOpen, setBroadcastMenuOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [terminalSettings, setTerminalSettings] = useState(loadTerminalSettings);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const tabMenuRef = useRef(null);
  const broadcastMenuRef = useRef(null);
  const toolsMenuRef = useRef(null);
  const tabsContainerRef = useRef(null);
  const tabScrollThrottleRef = useRef(0);

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


  // 3 Modos de Trabalho: 'foco' (apenas terminais) | 'expansivo' (todas as opções) | 'personalizado' (multiseletor)
  const [workMode, setWorkMode] = useState(() => {
    try {
      return localStorage.getItem('termius_work_mode') || 'expansivo';
    } catch {
      return 'expansivo';
    }
  });

  const DEFAULT_CUSTOM_CONFIG = {
    showSidebar: true,
    sidebarCompact: false,
    showActiveSessions: true,
    showAiBanners: true,
    showSmartBar: true,
    showSidecar: false,
    showStatusBar: true,
    showTopActions: true,
    showSplitControls: true
  };

  const [customConfig, setCustomConfig] = useState(() => {
    try {
      const stored = localStorage.getItem('termius_custom_config');
      return stored ? { ...DEFAULT_CUSTOM_CONFIG, ...JSON.parse(stored) } : DEFAULT_CUSTOM_CONFIG;
    } catch {
      return DEFAULT_CUSTOM_CONFIG;
    }
  });

  const [customModalOpen, setCustomModalOpen] = useState(false);

  const [customSidebarWidth, setCustomSidebarWidth] = useState(() => {
    try {
      const stored = localStorage.getItem('termius_sidebar_custom_width');
      return stored ? Number(stored) : 300;
    } catch {
      return 300;
    }
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('termius_work_mode') || 'expansivo';
      return saved === 'foco';
    } catch {
      return false;
    }
  });

  const isFoco = workMode === 'foco';
  const isExpansivo = workMode === 'expansivo';
  const isCustom = workMode === 'personalizado';

  // Lógica de visibilidade dos elementos nos 3 modos
  const shouldShowSidebar = isFoco 
    ? false 
    : isExpansivo 
    ? true 
    : Boolean(customConfig.showSidebar);

  const sidebarCompact = isFoco
    ? true
    : isExpansivo
    ? false
    : Boolean(customConfig.sidebarCompact);

  const effectiveSidebarWidth = useMemo(() => {
    if (!shouldShowSidebar) return 0;
    if (sidebarCompact) return 64;
    if (isExpansivo) return 280;
    return customSidebarWidth || 280;
  }, [shouldShowSidebar, sidebarCompact, isExpansivo, customSidebarWidth]);

  const shouldShowActiveSessions = isFoco
    ? false
    : isExpansivo
    ? true
    : Boolean(customConfig.showActiveSessions);

  const shouldShowAiBanners = isFoco
    ? false
    : isExpansivo
    ? true
    : Boolean(customConfig.showAiBanners);

  const shouldShowSmartBar = isFoco
    ? false
    : isExpansivo
    ? smartBarOpen
    : (Boolean(customConfig.showSmartBar) && smartBarOpen);

  const shouldShowStatusBar = isFoco
    ? false
    : isExpansivo
    ? true
    : Boolean(customConfig.showStatusBar);

  const shouldShowTopActions = isFoco
    ? false
    : isExpansivo
    ? true
    : Boolean(customConfig.showTopActions);

  const shouldShowSplitControls = isFoco
    ? false
    : isExpansivo
    ? true
    : Boolean(customConfig.showSplitControls);

  const shouldShowSidecar = isFoco
    ? false
    : isExpansivo
    ? sidecarOpen
    : (Boolean(customConfig.showSidecar) || sidecarOpen);

  const handleUpdateCustomConfig = (key, value) => {
    setCustomConfig((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('termius_custom_config', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleResetCustomConfig = () => {
    setCustomConfig(DEFAULT_CUSTOM_CONFIG);
    try {
      localStorage.setItem('termius_custom_config', JSON.stringify(DEFAULT_CUSTOM_CONFIG));
    } catch {}
  };

  const handleSelectAllCustomConfig = () => {
    const allTrue = {
      showSidebar: true,
      sidebarCompact: false,
      showActiveSessions: true,
      showAiBanners: true,
      showSmartBar: true,
      showSidecar: true,
      showStatusBar: true,
      showTopActions: true,
      showSplitControls: true,
    };
    setCustomConfig(allTrue);
    try {
      localStorage.setItem('termius_custom_config', JSON.stringify(allTrue));
    } catch {}
  };

  const handleSelectMinimalCustomConfig = () => {
    const minimal = {
      showSidebar: true,
      sidebarCompact: true,
      showActiveSessions: false,
      showAiBanners: false,
      showSmartBar: false,
      showSidecar: false,
      showStatusBar: false,
      showTopActions: false,
      showSplitControls: false,
    };
    setCustomConfig(minimal);
    try {
      localStorage.setItem('termius_custom_config', JSON.stringify(minimal));
    } catch {}
  };

  const handleSetWorkMode = (mode) => {
    setWorkMode(mode);
    try {
      localStorage.setItem('termius_work_mode', mode);
      if (mode !== 'foco') {
        localStorage.setItem('termius_work_mode_prev', mode);
      }
    } catch {}
    if (mode === 'foco') {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  };

  const handleToggleSidebarCollapse = () => {
    if (workMode === 'foco') {
      const prevMode = localStorage.getItem('termius_work_mode_prev') || 'expansivo';
      handleSetWorkMode(prevMode === 'foco' ? 'expansivo' : prevMode);
    } else {
      handleSetWorkMode('foco');
    }
  };

  const handleSetSidebarWidth = (newWidth) => {
    setCustomSidebarWidth(newWidth);
    try {
      localStorage.setItem('termius_sidebar_custom_width', newWidth);
    } catch {}
  };

  const TAB_COLORS = [
    { label: 'Esmeralda', hex: '#3fb950' },
    { label: 'Azul', hex: '#58a6ff' },
    { label: 'Ciano', hex: '#39c5cf' },
    { label: 'Roxo', hex: '#bc8cff' },
    { label: 'Âmbar', hex: '#d29922' },
    { label: 'Laranja', hex: '#f0883e' },
    { label: 'Rosa', hex: '#f778ba' },
    { label: 'Cinza', hex: '#8b949e' }
  ];

  const [tabContextMenu, setTabContextMenu] = useState(null); // { x, y, tab }
  const tabContextMenuRef = useRef(null);
  const [copiedCwd, setCopiedCwd] = useState(false);

  const handleCopyCwd = async () => {
    if (activeCwd) {
      await copyToClipboard(activeCwd);
      setCopiedCwd(true);
      setTimeout(() => setCopiedCwd(false), 2000);
    }
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSetTabColor = (tabId, color) => {
    setOpenTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, color } : t))
    );
    setTabContextMenu(null);
  };

  const handleDuplicateTab = (tab) => {
    handleNewTab(tab.cwd, `${tab.title} (Cópia)`, tab.host, tab.color, null, tab.isFluid);
    setTabContextMenu(null);
  };

  const handleCloseOtherTabs = (targetId) => {
    setOpenTabs((prev) => prev.filter((t) => t.id === targetId));
    setActiveTabId(targetId);
    setTabContextMenu(null);
  };

  const handleCloseTabsToRight = (targetId) => {
    const targetIdx = openTabs.findIndex((t) => t.id === targetId);
    if (targetIdx !== -1) {
      const kept = openTabs.slice(0, targetIdx + 1);
      setOpenTabs(kept);
      if (!kept.some((t) => t.id === activeTabId)) {
        setActiveTabId(targetId);
      }
    }
    setTabContextMenu(null);
  };

  // Fecha menu de contexto da aba ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tabContextMenuRef.current && !tabContextMenuRef.current.contains(e.target)) {
        setTabContextMenu(null);
      }
    };
    if (tabContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tabContextMenu]);

  // Modo de scroll da barra de abas: 'switch' (alternar abas) ou 'scroll' (rolar barra)
  const [tabScrollMode, setTabScrollMode] = useState(() => {
    try {
      return localStorage.getItem('termius_tab_scroll_mode') || 'switch';
    } catch {
      return 'switch';
    }
  });

  const toggleTabScrollMode = () => {
    const nextMode = tabScrollMode === 'switch' ? 'scroll' : 'switch';
    setTabScrollMode(nextMode);
    try {
      localStorage.setItem('termius_tab_scroll_mode', nextMode);
    } catch {}
  };

  const handleTabsWheel = (e) => {
    if (!tabsContainerRef.current) return;

    // 1. Shift pressionado: rola horizontalmente a barra
    if (e.shiftKey) {
      e.preventDefault();
      tabsContainerRef.current.scrollLeft += e.deltaY;
      return;
    }

    // 2. Modo 'switch' (Alternar Abas ao Rolar o Mouse):
    if (tabScrollMode === 'switch') {
      if (e.deltaY !== 0) {
        e.preventDefault();
        const now = Date.now();
        if (now - tabScrollThrottleRef.current > 110) {
          tabScrollThrottleRef.current = now;
          const direction = e.deltaY > 0 ? 1 : -1;
          const currentIndex = openTabs.findIndex((t) => t.id === activeTabId);
          if (currentIndex !== -1 && openTabs.length > 1) {
            const nextIndex = (currentIndex + direction + openTabs.length) % openTabs.length;
            setActiveTabId(openTabs[nextIndex].id);
            setCurrentView('terminals');
          }
        }
      }
      return;
    }

    // 3. Modo 'scroll' (Rolar Barra Horizontalmente com o Mouse):
    if (e.deltaY !== 0) {
      e.preventDefault();
      tabsContainerRef.current.scrollLeft += e.deltaY * 0.9;
    }
  };

  const scrollTabs = (offset) => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Mantém a aba ativa sempre visível ao trocar ou criar abas
  useEffect(() => {
    if (activeTabId && tabsContainerRef.current) {
      const activeEl = tabsContainerRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    }
  }, [activeTabId, openTabs.length]);

  const handleUpdateTerminalSettings = (newSettings) => {
    setTerminalSettings(newSettings);
    saveTerminalSettings(newSettings);
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Fecha menu de ferramentas ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target)) {
        setToolsMenuOpen(false);
      }
    };
    if (toolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [toolsMenuOpen]);

  // Fecha menu de seleção de broadcast ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (broadcastMenuRef.current && !broadcastMenuRef.current.contains(e.target)) {
        setBroadcastMenuOpen(false);
      }
    };
    if (broadcastMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [broadcastMenuOpen]);

  // Timer de gravação de terminal
  useEffect(() => {
    let interval = null;
    if (recordingTabId) {
      setRecordingDuration(0);
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingTabId]);

  const handleToggleRecord = (tabId) => {
    if (recordingTabId === tabId) {
      const result = stopRecording(tabId);
      setRecordingTabId(null);
      if (result && result.events && result.events.length > 0) {
        setReplayRecording(result);
        setReplayModalOpen(true);
      }
    } else {
      const currentTab = openTabs.find((t) => t.id === tabId);
      startRecording(tabId, { title: currentTab?.title || 'Terminal' });
      setRecordingTabId(tabId);
    }
  };


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

  const handleBroadcastInput = (sourceTabId, rawData) => {
    if (!broadcastEnabled) return;
    openTabs.forEach((tab) => {
      if (tab.id !== sourceTabId && (broadcastTargetIds.length === 0 || broadcastTargetIds.includes(tab.id))) {
        const commander = commandersRef.current[tab.id];
        if (commander && typeof commander.sendRaw === 'function') {
          commander.sendRaw(rawData);
        }
      }
    });
  };

  const handleToggleBroadcastTarget = (tabId) => {
    setBroadcastTargetIds((prev) => {
      if (prev.length === 0) {
        return openTabs.map(t => t.id).filter(id => id !== tabId);
      }
      if (prev.includes(tabId)) {
        return prev.filter(id => id !== tabId);
      }
      return [...prev, tabId];
    });
  };

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

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // F1 -> Central de Atalhos (Cheat Sheet)
      if (e.key === 'F1') {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // '?' (Shift + /) -> Central de Atalhos (se não estiver digitando em campo de texto)
      const isInput = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable);
      if (e.key === '?' && !isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Alt+1 ... Alt+9 -> Alternar diretamente para a aba 1 a 9
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key >= '1' && e.key <= '9') {
        const targetIndex = parseInt(e.key, 10) - 1;
        if (targetIndex < openTabs.length) {
          e.preventDefault();
          setActiveTabId(openTabs[targetIndex].id);
          setCurrentView('terminals');
          return;
        }
      }

      // Ctrl+Shift+W -> Fechar aba ativa
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId) {
          handleCloseTab(activeTabId);
          return;
        }
      }

      // Ctrl+PageDown / Ctrl+PageUp -> Próxima ou Aba Anterior
      if (e.ctrlKey && e.key === 'PageDown') {
        e.preventDefault();
        const currentIndex = openTabs.findIndex((t) => t.id === activeTabId);
        if (currentIndex !== -1 && openTabs.length > 1) {
          const nextIndex = (currentIndex + 1) % openTabs.length;
          setActiveTabId(openTabs[nextIndex].id);
          setCurrentView('terminals');
        }
        return;
      }
      if (e.ctrlKey && e.key === 'PageUp') {
        e.preventDefault();
        const currentIndex = openTabs.findIndex((t) => t.id === activeTabId);
        if (currentIndex !== -1 && openTabs.length > 1) {
          const prevIndex = (currentIndex - 1 + openTabs.length) % openTabs.length;
          setActiveTabId(openTabs[prevIndex].id);
          setCurrentView('terminals');
        }
        return;
      }

      // Ctrl+K -> AI Copilot
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCopilotOpen((prev) => !prev);
      }
      // Ctrl+Alt+V -> Split Vertical
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setSplitMode((prev) => prev === 'vertical' ? 'single' : 'vertical');
      }
      // Ctrl+Alt+H -> Split Horizontal
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setSplitMode((prev) => prev === 'horizontal' ? 'single' : 'horizontal');
      }
      // Ctrl+Shift+T -> Nova Aba
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleNewTab();
      }
      // Ctrl+Alt+A -> Toggle AI Sidecar
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSidecarOpen((prev) => !prev);
      }
      // Ctrl+Space or Ctrl+Shift+P -> Toggle Smart Command Bar
      if ((e.ctrlKey && (e.code === 'Space' || e.key === ' ')) || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setSmartBarOpen((prev) => !prev);
      }
      // Ctrl+Shift+S -> Toggle Skills Modal
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSkillsModalOpen((prev) => !prev);
      }
      // Ctrl+Shift+B -> Toggle Cluster Broadcast Mode
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setBroadcastEnabled((prev) => !prev);
      }
      // Ctrl+B -> Alternar recuo/expansão da coluna da esquerda (Sidebar)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [openTabs, activeTabId]);

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
        if (broadcastEnabled) {
          openTabs.forEach((tab) => {
            if (tab.id !== targetId && (broadcastTargetIds.length === 0 || broadcastTargetIds.includes(tab.id))) {
              const otherCmd = commandersRef.current[tab.id];
              if (otherCmd) {
                otherCmd(cmd, execute);
              }
            }
          });
        }
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
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        workMode={workMode}
        setWorkMode={handleSetWorkMode}
        sidebarWidth={effectiveSidebarWidth}
        setSidebarWidth={handleSetSidebarWidth}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        visible={shouldShowSidebar}
        showActiveSessions={shouldShowActiveSessions}
        showAiBanners={shouldShowAiBanners}
        onOpenCustomModal={() => setCustomModalOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
        {/* Top Terminal Tabs Bar */}
        <div className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center px-3 select-none justify-between shrink-0 gap-2 relative">
          {/* Toggle Sidebar Collapse button on desktop */}
          <button
            type="button"
            onClick={handleToggleSidebarCollapse}
            className="hidden md:flex w-8 h-8 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white items-center justify-center shrink-0 active:scale-95 transition-all border border-[#30363d] cursor-pointer"
            title={!shouldShowSidebar ? "Expandir barra lateral (Ctrl + B)" : "Recolher barra lateral (Ctrl + B)"}
          >
            {!shouldShowSidebar ? <PanelLeftOpen className="w-4 h-4 text-blue-400" /> : <PanelLeftClose className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Tabs list with overflow mask and mouse wheel access */}
          <div 
            ref={tabsContainerRef}
            onWheel={handleTabsWheel}
            className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none [mask-image:linear-gradient(to_right,white_calc(100%-16px),transparent)] scroll-smooth"
          >
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
                  data-tab-id={tab.id}
                  onClick={() => {
                    if (!isEditing) {
                      setActiveTabId(tab.id);
                      setCurrentView('terminals');
                    }
                  }}
                  onDoubleClick={(e) => handleStartEditTab(tab.id, tab.title, e)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTabContextMenu({
                      x: Math.min(e.clientX, window.innerWidth - 230),
                      y: Math.min(e.clientY, window.innerHeight - 300),
                      tab
                    });
                  }}
                  title={tab.autoTitle ? `Título: ${tab.title} (${tab.autoTitle})\nDuplo clique para renomear | Botão direito para opções` : `${tab.title}\nDuplo clique para renomear | Botão direito para opções`}
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
                      className="bg-[#161b22] text-white border border-blue-500 rounded px-2 py-0.5 text-base sm:text-xs font-semibold focus:outline-none w-28 sm:w-36"
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

          {/* Quick Tab Selector & Scroll Mode Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Scroll Navigation Chevrons */}
            <div className="hidden lg:flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => scrollTabs(-180)}
                className="w-6 h-6 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-[#30363d] cursor-pointer"
                title="Rolar abas para a esquerda"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTabs(180)}
                className="w-6 h-6 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-[#30363d] cursor-pointer"
                title="Rolar abas para a direita"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Toggle Scroll Mode: Alternar Abas x Rolar Barra */}
            <button
              type="button"
              onClick={toggleTabScrollMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                tabScrollMode === 'switch'
                  ? 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/40 text-blue-300 shadow-xs'
                  : 'bg-[#21262d] hover:bg-[#30363d] border-[#30363d] text-slate-300 hover:text-white'
              }`}
              title={
                tabScrollMode === 'switch'
                  ? 'Modo Scroll: Alternar Abas ao rolar o scroll do mouse (Clique para mudar para Rolar Barra)'
                  : 'Modo Scroll: Rolar Barra horizontalmente ao rolar o scroll do mouse (Clique para mudar para Alternar Abas)'
              }
            >
              <MousePointer className={`w-3.5 h-3.5 ${tabScrollMode === 'switch' ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className="hidden xl:inline text-xs font-medium">
                {tabScrollMode === 'switch' ? 'Scroll: Abas' : 'Scroll: Barra'}
              </span>
            </button>

            {/* Quick Tab Selector Dropdown */}
            <div className="relative" ref={tabMenuRef}>
              <button
                onClick={() => setTabMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white text-xs font-semibold transition-all border border-[#30363d] active:scale-95 cursor-pointer"
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
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0 whitespace-nowrap">
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
        </div>

          {/* Top Actions: AI Tools, Ferramentas Popover & Split Screen Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 pr-1 shrink-0">
            {/* Work Modes Switcher (FOCO | Expansivo | Custom ⚙️) */}
            <div className="flex items-center p-0.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs">
              <button
                type="button"
                onClick={() => handleSetWorkMode('foco')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  workMode === 'foco'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                }`}
                title="Modo FOCO: Apenas terminais (Ctrl + B)"
              >
                <Target className="w-3 h-3 text-cyan-300" />
                <span>FOCO</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetWorkMode('expansivo')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  workMode === 'expansivo'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                }`}
                title="Modo Expansivo: Todas as opções à mostra (280px)"
              >
                <Columns className="w-3 h-3 text-blue-300" />
                <span>Expansivo</span>
              </button>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleSetWorkMode('personalizado')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-l-lg font-bold transition-all cursor-pointer ${
                    workMode === 'personalizado'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                  }`}
                  title="Modo Custom: Configurado pelo menu multiseletor"
                >
                  <Sliders className="w-3 h-3 text-amber-300" />
                  <span>Custom</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(true)}
                  className={`px-1.5 py-1 rounded-r-lg font-bold transition-all cursor-pointer border-l border-[#30363d] ${
                    workMode === 'personalizado'
                      ? 'bg-amber-600/80 hover:bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-amber-300 hover:bg-[#21262d]'
                  }`}
                  title="Abrir Menu Multiseletor do Modo Custom"
                >
                  <SlidersHorizontal className="w-3 h-3 text-amber-300" />
                </button>
              </div>
            </div>

            {shouldShowTopActions && (
              <>

            {/* Skills IA Catalog Button */}
            <button
              type="button"
              onClick={() => setSkillsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all shadow-xs active:scale-95 whitespace-nowrap cursor-pointer"
              title="Catálogo de Skills & Especialistas IA em Português BR (Ctrl + Shift + S)"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Skills IA</span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-purple-500/25 text-purple-300 border border-purple-500/30">340</span>
            </button>

            {/* AI Copilot Button */}
            <button
              type="button"
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all shadow-xs active:scale-95 whitespace-nowrap cursor-pointer"
              title="AI Copilot (Ctrl + K)"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="hidden sm:inline">AI Copilot</span>
              <span className="text-xs font-mono opacity-75 hidden md:inline">Ctrl+K</span>
            </button>

            {/* AI Sidecar Toggle */}
            {currentView === 'terminals' && (
              <button
                type="button"
                onClick={() => setSidecarOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs active:scale-95 whitespace-nowrap cursor-pointer ${
                  sidecarOpen
                    ? 'bg-purple-600/25 text-purple-200 border-purple-500/50 shadow-purple-500/10'
                    : 'bg-[#21262d] text-slate-300 border-[#30363d] hover:text-white hover:bg-[#30363d]'
                }`}
                title="AI Sidecar: Acompanhe passos, raciocínio, comandos e diffs ao vivo (Ctrl + Alt + A)"
              >
                <PanelRight className={`w-3.5 h-3.5 ${sidecarOpen ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">AI Sidecar</span>
              </button>
            )}

            {/* Indicador direto de Gravação Ativa (1-click para parar se estiver gravando) */}
            {recordingTabId === activeTabId && (
              <button
                type="button"
                onClick={() => handleToggleRecord(activeTabId)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/50 shadow-rose-500/10 text-xs font-bold animate-pulse cursor-pointer"
                title="Sessão gravando. Clique para parar e assistir ao replay."
              >
                <Circle className="w-3 h-3 fill-rose-500 text-rose-500" />
                <span className="font-mono">
                  {`${Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:${(recordingDuration % 60).toString().padStart(2, '0')}`}
                </span>
                <span className="text-xs uppercase bg-rose-500/30 px-1 py-0.2 rounded font-mono">REC</span>
              </button>
            )}

            {/* Ferramentas / Quick Controls Popover */}
            {currentView === 'terminals' && (
              <div className="relative shrink-0" ref={toolsMenuRef}>
                <button
                  type="button"
                  onClick={() => setToolsMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs active:scale-95 whitespace-nowrap cursor-pointer ${
                    toolsMenuOpen || activeTab?.isFluid || broadcastEnabled
                      ? 'bg-[#21262d] text-white border-blue-500/50 shadow-blue-500/10'
                      : 'bg-[#21262d] text-slate-300 border-[#30363d] hover:text-white hover:bg-[#30363d]'
                  }`}
                  title="Painel de Ferramentas: Modo Fluido, Broadcast, Gravação, Smart Bar, Notificações e Atalhos F1"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Ferramentas</span>
                  {/* Status Indicator Pills */}
                  <div className="flex items-center gap-1">
                    {activeTab?.isFluid && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/20 animate-pulse" title="Modo Fluido Ativo" />
                    )}
                    {broadcastEnabled && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-cyan-400/20 animate-pulse" title="Broadcast Ativo" />
                    )}
                    {recordingTabId === activeTabId && (
                      <span className="w-2 h-2 rounded-full bg-rose-400 ring-2 ring-rose-400/20 animate-pulse" title="Gravação Ativa" />
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${toolsMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Popover Menu de Ferramentas */}
                {toolsMenuOpen && (
                  <div className="absolute right-0 top-11 w-80 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl z-50 py-2.5 px-3 divide-y divide-[#30363d]/60 animate-fade-in select-none">
                    {/* Header do Menu */}
                    <div className="pb-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-white">Painel de Ferramentas</span>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#21262d] text-slate-400 border border-[#30363d]">
                        Controles
                      </span>
                    </div>

                    {/* Quick Toggles List */}
                    <div className="py-2.5 space-y-2">
                      {/* Modo Fluido Toggle */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[#0d1117]/80 border border-[#30363d]/70 hover:border-[#30363d] transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeTab?.isFluid ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-[#21262d] text-slate-400'}`}>
                            <Zap className={`w-4 h-4 ${activeTab?.isFluid ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-white block leading-tight truncate">Modo Fluido</span>
                            <span className="text-xs text-slate-400 block truncate">Auto-aprova perguntas</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleFluidMode(activeTabId)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 cursor-pointer ${
                            activeTab?.isFluid
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                              : 'bg-[#21262d] text-slate-400 border-[#30363d] hover:text-white'
                          }`}
                        >
                          {activeTab?.isFluid ? 'ATIVO' : 'DESL'}
                        </button>
                      </div>

                      {/* Cluster Broadcast Toggle */}
                      <div className="p-2 rounded-xl bg-[#0d1117]/80 border border-[#30363d]/70 hover:border-[#30363d] transition-colors space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${broadcastEnabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-[#21262d] text-slate-400'}`}>
                              <Radio className={`w-4 h-4 ${broadcastEnabled ? 'animate-pulse text-cyan-400' : ''}`} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-white block leading-tight truncate">Cluster Broadcast</span>
                              <span className="text-xs text-slate-400 block truncate">Espelha digitação em abas</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBroadcastEnabled((prev) => !prev)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 cursor-pointer ${
                              broadcastEnabled
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs'
                                : 'bg-[#21262d] text-slate-400 border-[#30363d] hover:text-white'
                            }`}
                          >
                            {broadcastEnabled ? 'ATIVO' : 'DESL'}
                          </button>
                        </div>

                        {/* Configuração de Alvos se Broadcast Ativo */}
                        {broadcastEnabled && (
                          <div className="pt-2 border-t border-[#21262d] space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>Alvos: {broadcastTargetIds.length === 0 ? 'Todas as abas' : `${broadcastTargetIds.length} selecionadas`}</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setBroadcastTargetIds([])}
                                  className="px-1.5 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 text-xs font-semibold cursor-pointer"
                                >
                                  Todas
                                </button>
                                {effectiveSecondaryTabId && (
                                  <button
                                    type="button"
                                    onClick={() => setBroadcastTargetIds([activeTabId, effectiveSecondaryTabId])}
                                    className="px-1.5 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 text-xs font-semibold cursor-pointer"
                                  >
                                    Split
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                              {openTabs.map((t) => {
                                const isTarget = broadcastTargetIds.length === 0 || broadcastTargetIds.includes(t.id);
                                return (
                                  <div
                                    key={t.id}
                                    onClick={() => handleToggleBroadcastTarget(t.id)}
                                    className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-[#21262d] cursor-pointer text-xs"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color || '#3fb950' }} />
                                      <span className={`truncate ${isTarget ? 'text-white font-medium' : 'text-slate-500 line-through'}`}>{t.title}</span>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={isTarget}
                                      onChange={() => {}}
                                      className="accent-cyan-500 rounded cursor-pointer"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Gravador de Sessão (Asciicast v2) */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[#0d1117]/80 border border-[#30363d]/70 hover:border-[#30363d] transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${recordingTabId === activeTabId ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-[#21262d] text-slate-400'}`}>
                            {recordingTabId === activeTabId ? (
                              <Circle className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                            ) : (
                              <Film className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-white block leading-tight truncate">Gravador de Sessão</span>
                            <span className="text-xs text-slate-400 block truncate">
                              {recordingTabId === activeTabId
                                ? `Gravando (${Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:${(recordingDuration % 60).toString().padStart(2, '0')})`
                                : 'Exporta em Asciicast v2'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleRecord(activeTabId)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 cursor-pointer ${
                            recordingTabId === activeTabId
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse shadow-xs'
                              : 'bg-[#21262d] text-slate-300 border-[#30363d] hover:text-white'
                          }`}
                        >
                          {recordingTabId === activeTabId ? 'PARAR' : 'REC'}
                        </button>
                      </div>

                      {/* Smart Command Bar Toggle */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[#0d1117]/80 border border-[#30363d]/70 hover:border-[#30363d] transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${smartBarOpen ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-[#21262d] text-slate-400'}`}>
                            <Sparkles className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-white block leading-tight truncate">Smart Command Bar</span>
                            <span className="text-xs text-slate-400 block truncate">Autocomplete preditivo (Ctrl+Espaço)</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSmartBarOpen((prev) => !prev)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 cursor-pointer ${
                            smartBarOpen
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-xs'
                              : 'bg-[#21262d] text-slate-400 border-[#30363d] hover:text-white'
                          }`}
                        >
                          {smartBarOpen ? 'ATIVO' : 'DESL'}
                        </button>
                      </div>

                      {/* Notificações Desktop & Chime */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[#0d1117]/80 border border-[#30363d]/70 hover:border-[#30363d] transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${notificationsEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-[#21262d] text-slate-400'}`}>
                            {notificationsEnabled ? <Bell className="w-4 h-4 text-emerald-400" /> : <BellOff className="w-4 h-4 text-slate-400" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-white block leading-tight truncate">Notificações & Áudio</span>
                            <span className="text-xs text-slate-400 block truncate">Alerta sonoro de conclusão</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = !notificationsEnabled;
                            setNotificationsEnabled(nextState);
                            setNotificationEnabled(nextState);
                            if (nextState) {
                              requestNotificationPermission();
                              playNotificationSound();
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 cursor-pointer ${
                            notificationsEnabled
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs'
                              : 'bg-[#21262d] text-slate-400 border-[#30363d] hover:text-white'
                          }`}
                        >
                          {notificationsEnabled ? 'ATIVO' : 'DESL'}
                        </button>
                      </div>

                      {/* Aparência & Temas do Terminal */}
                      <div 
                        onClick={() => {
                          setToolsMenuOpen(false);
                          setThemeModalOpen(true);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#0d1117]/80 border border-[#30363d]/70 hover:border-purple-500/50 hover:bg-[#161b22] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-purple-500/20 text-purple-300 border border-purple-500/40 group-hover:scale-105 transition-transform">
                            <Palette className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-white block leading-tight truncate">Temas & Tipografia</span>
                            <span className="text-xs text-slate-400 block truncate">
                              {TERMINAL_THEMES.find(t => t.id === terminalSettings.themeId)?.name || 'Padrão'} • {terminalSettings.fontSize}px
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                          Ajustar
                        </span>
                      </div>
                    </div>

                    {/* Central de Atalhos Link */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setToolsMenuOpen(false);
                          setShortcutsModalOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                          <span>Ver Central de Atalhos</span>
                        </div>
                        <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-200 border border-blue-500/30">
                          F1
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Split Screen Mode Buttons */}
        {shouldShowSplitControls && currentView === 'terminals' && (
          <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-[#30363d] gap-1">
            <button
              type="button"
              onClick={() => setSplitMode('single')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
                splitMode === 'single'
                  ? 'bg-[#21262d] text-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tela Cheia (1 Terminal)"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (openTabs.length < 2) handleNewTab();
                setSplitMode('vertical');
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
                splitMode === 'vertical'
                  ? 'bg-[#21262d] text-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Dividir Verticalmente (Ctrl + Alt + V)"
            >
              <Columns2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (openTabs.length < 2) handleNewTab();
                setSplitMode('horizontal');
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95 cursor-pointer ${
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
                              <span className="text-xs text-blue-300/80 font-mono px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 whitespace-nowrap">
                                editado
                              </span>
                            )}
                            {isPrimary && (
                              <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/30 shrink-0 whitespace-nowrap">
                                Foco
                              </span>
                            )}
                            {broadcastEnabled && (
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap flex items-center gap-1 ${
                                isPrimary 
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                                  : (broadcastTargetIds.length === 0 || broadcastTargetIds.includes(tab.id))
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                  : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}>
                                <Radio className="w-2.5 h-2.5" />
                                <span>{isPrimary ? 'Fonte' : (broadcastTargetIds.length === 0 || broadcastTargetIds.includes(tab.id)) ? 'Cluster' : 'Pausado'}</span>
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
                            onBroadcastInput={handleBroadcastInput}
                            isBroadcastActive={broadcastEnabled}
                            isBroadcastOrigin={broadcastEnabled && isPrimary}
                            isBroadcastTarget={broadcastEnabled && !isPrimary && (broadcastTargetIds.length === 0 || broadcastTargetIds.includes(tab.id))}
                            terminalSettings={terminalSettings}
                          />
                        </ErrorBoundary>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Smart Command Bar (Autocomplete Preditivo Contextual) */}
              {shouldShowSmartBar && (
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
            {shouldShowSidecar && (
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

        {/* Sleek Bottom Status Bar */}
        {shouldShowStatusBar && (
          <footer className="h-7 bg-[#161b22] border-t border-[#30363d] px-3 flex items-center justify-between text-xs text-slate-400 select-none shrink-0 z-20 gap-3">
          {/* Lado Esquerdo: Host, CWD e Abas */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Host Status Indicator */}
            <div className="flex items-center gap-1.5 font-medium text-slate-300 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs">{activeTab?.host ? activeTab.host.label : 'localhost'}</span>
            </div>

            <span className="text-[#30363d] hidden sm:inline">|</span>

            {/* CWD com botão para copiar */}
            <button
              type="button"
              onClick={handleCopyCwd}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-[#21262d] text-slate-300 hover:text-white transition-colors cursor-pointer truncate max-w-[200px] sm:max-w-xs group font-mono text-xs"
              title={`${activeCwd}\nClique para copiar o caminho`}
            >
              {copiedCwd ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 font-sans font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{activeCwd.replace('/home/nader', '~')}</span>
                </>
              )}
            </button>

            <span className="text-[#30363d] hidden md:inline">|</span>

            {/* Total de Abas Abertas */}
            <div className="hidden md:flex items-center gap-1 text-slate-400 text-xs shrink-0">
              <Terminal className="w-3 h-3 text-slate-500" />
              <span>{openTabs.length} {openTabs.length === 1 ? 'terminal' : 'terminais'}</span>
            </div>
          </div>

          {/* Centro: Status do Agente, Gravação REC e Cluster Broadcast */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {recordingTabId === activeTabId && (
              <button
                type="button"
                onClick={() => handleToggleRecord(activeTabId)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold animate-pulse cursor-pointer"
                title="Sessão gravando. Clique para parar e assistir ao replay."
              >
                <Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                <span className="font-mono">REC {formatDuration(recordingDuration)}</span>
              </button>
            )}

            {broadcastEnabled && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Cluster Broadcast</span>
              </span>
            )}

            {activeTab?.isFluid ? (
              <span className="flex items-center gap-1 text-amber-300 font-bold text-xs" title="Modo Fluido ativo: Confirmações auto-aprovadas">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                <span className="hidden lg:inline">Modo Fluido</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-purple-300 font-medium text-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden lg:inline">Antigravity</span>
              </span>
            )}
          </div>

          {/* Lado Direito: Tema, Som, Sidecar, Modo de Trabalho & Atalhos */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tema Ativo */}
            <button
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-[#21262d] text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
              title="Personalizar Tema e Tipografia do Terminal"
            >
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline font-medium">{terminalSettings.fontSize || 13}px</span>
            </button>

            {/* Alternar Notificações / Som */}
            <button
              type="button"
              onClick={() => {
                const next = !notificationsEnabled;
                setNotificationsEnabled(next);
                setNotificationEnabled(next);
                if (next) {
                  requestNotificationPermission();
                  playNotificationSound();
                }
              }}
              className="p-1 rounded-md hover:bg-[#21262d] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={notificationsEnabled ? "Notificações e Som ATIVOS (Clique para mutar)" : "Notificações e Som MUTADOS (Clique para ativar)"}
            >
              {notificationsEnabled ? <Bell className="w-3.5 h-3.5 text-emerald-400" /> : <BellOff className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {/* Alternar Painel Sidecar */}
            <button
              type="button"
              onClick={() => setSidecarOpen((p) => !p)}
              className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                sidecarOpen ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'hover:bg-[#21262d] text-slate-400'
              }`}
              title="Alternar painel lateral do AI Sidecar (Ctrl + Alt + A)"
            >
              AI Sidecar
            </button>

            {/* Central de Atalhos (F1) */}
            <button
              type="button"
              onClick={() => setShortcutsModalOpen(true)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-[#21262d] text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
              title="Central de Atalhos de Teclado (F1 ou ?)"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-[11px] font-bold">F1</span>
            </button>
          </div>
        </footer>
      )}

        {/* Menu de Contexto da Aba com Botão Direito */}
        {tabContextMenu && (
          <div
            ref={tabContextMenuRef}
            style={{ top: `${tabContextMenu.y}px`, left: `${tabContextMenu.x}px` }}
            className="fixed z-50 w-56 bg-[#161b22]/95 border border-[#30363d] rounded-2xl shadow-2xl backdrop-blur-md py-2 text-xs text-slate-200 animate-fade-in select-none"
          >
            {/* Cabeçalho do Menu com Título da Aba */}
            <div className="px-3 py-1 pb-2 border-b border-[#30363d]/60 flex items-center justify-between">
              <span className="font-bold text-white text-xs truncate max-w-[150px]">
                {tabContextMenu.tab.title}
              </span>
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                style={{ backgroundColor: tabContextMenu.tab.color || '#3fb950' }} 
              />
            </div>

            {/* Paleta de Cores para a Aba */}
            <div className="px-3 py-2 border-b border-[#30363d]/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                Cor da Aba
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {TAB_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleSetTabColor(tabContextMenu.tab.id, c.hex)}
                    className={`w-5 h-5 rounded-full transition-transform hover:scale-125 cursor-pointer shadow-xs ${
                      tabContextMenu.tab.color === c.hex ? 'ring-2 ring-white scale-110' : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  handleStartEditTab(tabContextMenu.tab.id, tabContextMenu.tab.title);
                  setTabContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                <span>Renomear Aba</span>
              </button>

              <button
                type="button"
                onClick={() => handleDuplicateTab(tabContextMenu.tab)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Duplicar Aba</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleToggleFluidMode(tabContextMenu.tab.id);
                  setTabContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Zap className={`w-3.5 h-3.5 ${tabContextMenu.tab.isFluid ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                  <span>Modo Fluido</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${tabContextMenu.tab.isFluid ? 'bg-amber-500/20 text-amber-300' : 'bg-[#21262d] text-slate-400'}`}>
                  {tabContextMenu.tab.isFluid ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            <div className="my-1 border-t border-[#30363d]/60" />

            {/* Fechar Abas */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  handleCloseTab(tabContextMenu.tab.id);
                  setTabContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-rose-300 hover:text-rose-200 hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Fechar Esta Aba</span>
              </button>

              {openTabs.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleCloseOtherTabs(tabContextMenu.tab.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-300 hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span>Fechar Outras Abas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCloseTabsToRight(tabContextMenu.tab.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-300 hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span>Fechar Abas à Direita</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

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

        {/* Modal de Reprodução de Sessão Gravada (Asciicast v2) */}
        <SessionReplayModal
          recording={replayRecording}
          isOpen={replayModalOpen}
          onClose={() => setReplayModalOpen(false)}
        />

        {/* Central de Atalhos de Teclado (F1 / ?) */}
        <KeyboardShortcutsModal
          isOpen={shortcutsModalOpen}
          onClose={() => setShortcutsModalOpen(false)}
        />

        {/* Modal de Aparência & Temas do Terminal */}
        <TerminalThemeModal
          isOpen={themeModalOpen}
          onClose={() => setThemeModalOpen(false)}
          settings={terminalSettings}
          onUpdateSettings={handleUpdateTerminalSettings}
        />

        {/* Modal Multiseletor do Modo Custom */}
        <CustomWorkModeModal
          isOpen={customModalOpen}
          onClose={() => setCustomModalOpen(false)}
          config={customConfig}
          onUpdateConfig={handleUpdateCustomConfig}
          onResetDefault={handleResetCustomConfig}
          onSelectAll={handleSelectAllCustomConfig}
          onSelectMinimal={handleSelectMinimalCustomConfig}
          onActivateCustomMode={() => handleSetWorkMode('personalizado')}
          isCustomActive={workMode === 'personalizado'}
        />
      </main>
    </div>
  );
}
