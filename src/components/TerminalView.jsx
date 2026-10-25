import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { 
  Zap, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  X as XIcon,
  Copy,
  Check,
  CornerDownLeft,
  CheckSquare,
  Trash2
} from 'lucide-react';
import { sendNotification } from '../services/notificationService';
import { recordOutput } from '../services/sessionRecorder';
import { getThemeDefinition, DEFAULT_TERMINAL_SETTINGS } from '../services/terminalThemes';
import { copyToClipboard, readFromClipboard } from '../services/clipboardService';

export default function TerminalView({ 
  tab, 
  onTitleChange, 
  isActive, 
  onRegisterCommander,
  onBroadcastInput,
  isBroadcastActive,
  isBroadcastOrigin,
  isBroadcastTarget,
  terminalSettings
}) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);
  const isFluidRef = useRef(Boolean(tab.isFluid));
  const lastAutoApproveRef = useRef(0);
  const commandStartTimeRef = useRef(0);
  const commandRunningRef = useRef(false);
  const lastCommandNameRef = useRef('');
  const [fluidAlert, setFluidAlert] = useState(false);

  // Estados de Área de Transferência & Menu de Contexto
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, hasSelection }
  const contextMenuRef = useRef(null);
  const copyFeedbackTimerRef = useRef(null);

  const triggerCopyToast = () => {
    if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current);
    setCopyFeedback(true);
    copyFeedbackTimerRef.current = setTimeout(() => {
      setCopyFeedback(false);
    }, 1800);
  };

  // Fecha menu de contexto ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const searchAddonRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);
  const [searchResult, setSearchResult] = useState({ resultIndex: -1, resultCount: 0 });

  const broadcastRef = useRef({ 
    active: isBroadcastActive, 
    origin: isBroadcastOrigin, 
    cb: onBroadcastInput 
  });

  useEffect(() => {
    broadcastRef.current = { 
      active: isBroadcastActive, 
      origin: isBroadcastOrigin, 
      cb: onBroadcastInput 
    };
  }, [isBroadcastActive, isBroadcastOrigin, onBroadcastInput]);

  useEffect(() => {
    isFluidRef.current = Boolean(tab.isFluid);
  }, [tab.isFluid]);

  useEffect(() => {
    if (!containerRef.current) return;

    const activeTheme = getThemeDefinition(terminalSettings?.themeId);
    const fontSize = terminalSettings?.fontSize || 13;
    const cursorStyle = terminalSettings?.cursorStyle || 'block';
    const cursorBlink = terminalSettings?.cursorBlink !== false;

    // Initialize Xterm
    const term = new Terminal({
      cursorBlink,
      cursorStyle,
      fontFamily: '"Fira Code", "JetBrains Mono", Menlo, Monaco, Consolas, monospace',
      fontSize,
      lineHeight: 1.25,
      theme: activeTheme,
      allowTransparency: true,
      allowProposedApi: true,
      convertEol: false
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.loadAddon(searchAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    searchAddon.onDidChangeResults((e) => {
      if (e) {
        setSearchResult({
          resultIndex: e.resultIndex,
          resultCount: e.resultCount
        });
      }
    });

    term.attachCustomKeyEventHandler((event) => {
      if (event.type !== 'keydown') return true;

      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      const key = event.key ? event.key.toLowerCase() : '';

      // 1. Ctrl+F / Cmd+F -> In-Buffer Search
      if (isCtrlOrMeta && !event.shiftKey && !event.altKey && key === 'f') {
        setSearchOpen((prev) => !prev);
        return false;
      }

      // 2. Ctrl+C ou Ctrl+Shift+C -> Smart Copy
      if (isCtrlOrMeta && key === 'c') {
        if (term.hasSelection()) {
          const selectedText = term.getSelection();
          copyToClipboard(selectedText);
          triggerCopyToast();
          return false; // Interrompe para NÃO enviar SIGINT (\x03) quando houver seleção
        }
        if (event.shiftKey) {
          return false;
        }
        // Sem seleção: Ctrl+C normal envia SIGINT ao shell para cancelar processo
        return true;
      }

      // 3. Ctrl+V ou Ctrl+Shift+V -> Smart Paste
      if (isCtrlOrMeta && key === 'v') {
        event.preventDefault();
        readFromClipboard().then((clipboardText) => {
          if (clipboardText && termRef.current) {
            termRef.current.paste(clipboardText);
          }
        });
        return false; // Interrompe para NÃO enviar raw ^V (\x16) ao shell
      }

      // 4. Ctrl+Shift+A -> Selecionar Tudo
      if (isCtrlOrMeta && event.shiftKey && key === 'a') {
        term.selectAll();
        return false;
      }

      // 5. Deixar atalhos globais passarem para o listener da janela
      if (
        event.key === 'F1' ||
        (event.altKey && event.key >= '1' && event.key <= '9') ||
        (isCtrlOrMeta && event.shiftKey && key === 'w') ||
        (isCtrlOrMeta && (key === 'k' || key === 'a' || key === 'b' || key === 's')) ||
        (event.ctrlKey && (event.key === 'PageDown' || event.key === 'PageUp'))
      ) {
        return false;
      }

      return true;
    });

    // Listen to terminal title changes (OSC 0 / OSC 2 from shell or running processes)
    term.onTitleChange((newTitle) => {
      if (onTitleChange && typeof onTitleChange === 'function' && newTitle) {
        onTitleChange(tab.id, newTitle.trim());
      }
    });

    // Establish WebSocket Connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      // Send init message
      socket.send(JSON.stringify({
        type: 'init',
        cwd: tab.cwd || '/home/nader',
        cols: term.cols,
        rows: term.rows,
        host: tab.host || null
      }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output') {
          term.write(msg.data);
          recordOutput(tab.id, msg.data);

          // Auto-aprovação em tempo real no Modo Fluido
          if (isFluidRef.current && msg.data) {
            const cleanText = msg.data.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
            // Detecta padrões de confirmação como:
            // "Run this command? 1. Yes, run command; 2. Yes, and..."
            const isConfirmationPrompt = /(Run this command\?|1\.\s*Yes,\s*run|Allow this (command|tool)\?|Confirm execution\?|Do you want to run this command\?)/i.test(cleanText);

            if (isConfirmationPrompt) {
              const now = Date.now();
              // Cooldown de 1.2s para evitar envio duplicado para o mesmo prompt
              if (now - lastAutoApproveRef.current > 1200) {
                lastAutoApproveRef.current = now;
                setFluidAlert(true);
                setTimeout(() => setFluidAlert(false), 2400);

                sendNotification({
                  title: '⚡ Modo Fluido',
                  body: `Aba "${tab.title || 'Terminal'}": Confirmação do Antigravity aprovada automaticamente.`
                });

                // Envia 1\r automaticamente após renderização do prompt
                setTimeout(() => {
                  if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({ type: 'input', data: '1\r' }));
                  }
                }, 100);
              }
            }
          }

          // Notificação de conclusão para comandos longos (> 3.5s)
          if (commandRunningRef.current && msg.data) {
            const elapsed = Date.now() - commandStartTimeRef.current;
            if (elapsed >= 3500) {
              const cleanOutput = msg.data.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
              const isPromptReturned = /(?:[\w\-.]+@[\w\-.]+:.*[#$%>❯➜]\s*$)|(?:^|\n)[#$%>❯➜]\s*$/m.test(cleanOutput.trim());
              if (isPromptReturned) {
                commandRunningRef.current = false;
                const seconds = Math.round(elapsed / 1000);
                const cmdLabel = lastCommandNameRef.current ? ` ("${lastCommandNameRef.current}")` : '';
                sendNotification({
                  title: 'Comando Concluído',
                  body: `Aba "${tab.title || 'Terminal'}": Execução finalizada em ${seconds}s${cmdLabel}.`
                });
                lastCommandNameRef.current = '';
              }
            }
          }
        } else if (msg.type === 'exit') {
          if (commandRunningRef.current) {
            const elapsed = Date.now() - commandStartTimeRef.current;
            if (elapsed >= 3500) {
              const seconds = Math.round(elapsed / 1000);
              sendNotification({
                title: 'Processo Finalizado',
                body: `Aba "${tab.title || 'Terminal'}": Execução encerrada após ${seconds}s.`
              });
            }
            commandRunningRef.current = false;
            lastCommandNameRef.current = '';
          }
          term.write('\r\n\x1b[33m[Processo finalizado]\x1b[0m\r\n');
        }
      } catch {
        term.write(event.data);
      }
    };

    socket.onclose = () => {
      term.write('\r\n\x1b[31m[Conexão com terminal encerrada]\x1b[0m\r\n');
    };

    // User input to PTY
    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        if (data.includes('\r') || data.includes('\n')) {
          commandStartTimeRef.current = Date.now();
          commandRunningRef.current = true;
        }
        socket.send(JSON.stringify({ type: 'input', data }));

        // Espelha digitação em tempo real se Broadcast Mode estiver ativo
        if (broadcastRef.current.active && broadcastRef.current.origin && typeof broadcastRef.current.cb === 'function') {
          broadcastRef.current.cb(tab.id, data);
        }
      }
    });

    // Resize handling with requestAnimationFrame to eliminate ResizeObserver loop warnings
    let resizeRafId = null;
    const handleResize = () => {
      if (!fitAddonRef.current || !termRef.current) return;
      fitAddonRef.current.fit();
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'resize',
          cols: termRef.current.cols,
          rows: termRef.current.rows
        }));
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(() => {
        handleResize();
      });
    });
    resizeObserver.observe(containerRef.current);

    // Expose commander function so snippets, AI copilot and cluster broadcast can be injected
    if (onRegisterCommander) {
      const commanderFn = (command, execute = true) => {
        if (socket.readyState === WebSocket.OPEN) {
          if (execute) {
            commandStartTimeRef.current = Date.now();
            commandRunningRef.current = true;
            lastCommandNameRef.current = command.slice(0, 30);
          }
          socket.send(JSON.stringify({ type: 'input', data: execute ? `${command}\n` : command }));
          term.focus();
        }
      };

      // Injeção direta de raw input para espelhamento em cluster sem forçar quebra de linha
      commanderFn.sendRaw = (rawData) => {
        if (socket.readyState === WebSocket.OPEN) {
          if (rawData.includes('\r') || rawData.includes('\n')) {
            commandStartTimeRef.current = Date.now();
            commandRunningRef.current = true;
          }
          socket.send(JSON.stringify({ type: 'input', data: rawData }));
        }
      };

      onRegisterCommander(tab.id, commanderFn);
    }

    return () => {
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      resizeObserver.disconnect();
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      term.dispose();
    };
  }, [tab.id]);

  // Atualização dinâmica em tempo real do tema, tamanho de fonte e cursor sem reiniciar PTY
  useEffect(() => {
    if (!termRef.current) return;
    const activeTheme = getThemeDefinition(terminalSettings?.themeId);
    termRef.current.options.theme = activeTheme;
    termRef.current.options.fontSize = terminalSettings?.fontSize || 13;
    termRef.current.options.cursorStyle = terminalSettings?.cursorStyle || 'block';
    termRef.current.options.cursorBlink = terminalSettings?.cursorBlink !== false;

    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'resize',
          cols: termRef.current.cols,
          rows: termRef.current.rows
        }));
      }
    }
  }, [terminalSettings]);

  useEffect(() => {
    if (isActive && fitAddonRef.current && termRef.current) {
      setTimeout(() => {
        fitAddonRef.current.fit();
        termRef.current.focus();
      }, 50);
    }
  }, [isActive]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [searchOpen]);

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (!searchAddonRef.current) return;
    if (!query) {
      searchAddonRef.current.clearDecorations();
      setSearchResult({ resultIndex: -1, resultCount: 0 });
      return;
    }
    searchAddonRef.current.findNext(query, {
      caseSensitive: searchCaseSensitive,
      incremental: true
    });
  };

  const handleFindNext = () => {
    if (!searchAddonRef.current || !searchQuery) return;
    searchAddonRef.current.findNext(searchQuery, {
      caseSensitive: searchCaseSensitive
    });
  };

  const handleFindPrevious = () => {
    if (!searchAddonRef.current || !searchQuery) return;
    searchAddonRef.current.findPrevious(searchQuery, {
      caseSensitive: searchCaseSensitive
    });
  };

  const handleToggleCase = () => {
    const nextCase = !searchCaseSensitive;
    setSearchCaseSensitive(nextCase);
    if (searchAddonRef.current && searchQuery) {
      searchAddonRef.current.findNext(searchQuery, {
        caseSensitive: nextCase
      });
    }
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
    if (searchAddonRef.current) {
      searchAddonRef.current.clearDecorations();
    }
    if (termRef.current) {
      termRef.current.focus();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handleFindPrevious();
      } else {
        handleFindNext();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCloseSearch();
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    const term = termRef.current;
    const hasSelection = term ? term.hasSelection() : false;
    const rect = containerRef.current?.getBoundingClientRect();
    const posX = e.clientX - (rect ? rect.left : 0);
    const posY = e.clientY - (rect ? rect.top : 0);
    setContextMenu({
      x: Math.min(posX, Math.max(10, (rect?.width || 300) - 220)),
      y: Math.min(posY, Math.max(10, (rect?.height || 200) - 210)),
      hasSelection
    });
  };

  const handleAuxClick = async (e) => {
    // Botão do meio do mouse (Linux middle-click paste)
    if (e.button === 1) {
      e.preventDefault();
      const text = await readFromClipboard();
      if (text && termRef.current) {
        termRef.current.paste(text);
      }
    }
  };

  const handleCopyFromMenu = async () => {
    if (termRef.current?.hasSelection()) {
      const text = termRef.current.getSelection();
      await copyToClipboard(text);
      triggerCopyToast();
    }
    setContextMenu(null);
  };

  const handlePasteFromMenu = async () => {
    const text = await readFromClipboard();
    if (text && termRef.current) {
      termRef.current.paste(text);
    }
    setContextMenu(null);
  };

  const handleSelectAllFromMenu = () => {
    termRef.current?.selectAll();
    setContextMenu(null);
  };

  const handleClearTerminalFromMenu = () => {
    termRef.current?.clear();
    setContextMenu(null);
  };

  const handleSearchFromMenu = () => {
    setSearchOpen(true);
    setContextMenu(null);
  };

  return (
    <div 
      className={`h-full w-full bg-[#0d1117] relative group ${isActive ? 'block' : 'hidden'}`}
      ref={containerRef}
      onContextMenu={handleContextMenu}
      onAuxClick={handleAuxClick}
    >
      {/* Botão flutuante para abrir busca no terminal (Ctrl+F) */}
      {!searchOpen && (
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="absolute top-2.5 right-3 z-20 opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1.5 rounded-lg bg-[#161b22]/80 hover:bg-[#21262d] text-slate-400 hover:text-white border border-[#30363d]/80 transition-all cursor-pointer shadow-md select-none"
          title="Buscar no buffer do terminal (Ctrl + F)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Barra flutuante de Pesquisa In-Buffer (Ctrl + F) */}
      {searchOpen && (
        <div className="absolute top-2.5 right-4 z-30 flex items-center gap-1.5 bg-[#161b22]/95 border border-[#30363d] rounded-xl px-2.5 py-1.5 shadow-2xl backdrop-blur-md animate-fade-in text-xs select-none">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar no terminal..."
            className="bg-transparent text-white text-base sm:text-xs font-mono focus:outline-none w-36 sm:w-48 placeholder:text-slate-500"
          />

          <span className="text-slate-400 font-mono text-xs px-1 min-w-[3rem] text-center">
            {searchResult.resultCount > 0
              ? `${searchResult.resultIndex + 1}/${searchResult.resultCount}`
              : searchQuery ? '0/0' : ''}
          </span>

          <button
            type="button"
            onClick={handleFindPrevious}
            className="p-1 hover:bg-[#21262d] rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Ocorrência anterior (Shift+Enter)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFindNext}
            className="p-1 hover:bg-[#21262d] rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Próxima ocorrência (Enter)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleCase}
            className={`px-1.5 py-0.5 rounded font-mono text-xs font-bold transition-colors cursor-pointer ${
              searchCaseSensitive
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
            }`}
            title="Diferenciar maiúsculas/minúsculas"
          >
            Aa
          </button>

          <button
            type="button"
            onClick={handleCloseSearch}
            className="p-1 hover:bg-[#21262d] rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer ml-1"
            title="Fechar busca (Esc)"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toast flutuante de auto-aprovação do Modo Fluido */}
      {fluidAlert && (
        <div className="absolute top-3 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/10 backdrop-blur-md animate-bounce select-none pointer-events-none">
          <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>⚡ Modo Fluido: Comando auto-aprovado (1. Yes)</span>
        </div>
      )}

      {/* Badges de Cluster Broadcast */}
      {isBroadcastActive && isBroadcastOrigin && (
        <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-bold shadow-md shadow-cyan-500/10 backdrop-blur-md select-none pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>📡 Cluster: Fonte (Replicando)</span>
        </div>
      )}

      {isBroadcastActive && isBroadcastTarget && (
        <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-xs font-bold shadow-md shadow-indigo-500/10 backdrop-blur-md select-none pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>📡 Cluster: Alvo (Espelhado)</span>
        </div>
      )}

      {/* Toast flutuante de confirmação de cópia */}
      {copyFeedback && (
        <div className="absolute bottom-5 right-5 z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold shadow-2xl backdrop-blur-md animate-fade-in select-none pointer-events-none">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Copiado para a área de transferência!</span>
        </div>
      )}

      {/* Menu de contexto flutuante com botão direito */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="absolute z-50 w-52 bg-[#161b22]/95 border border-[#30363d] rounded-xl shadow-2xl backdrop-blur-md py-1.5 text-xs text-slate-200 animate-fade-in select-none"
        >
          <button
            type="button"
            onClick={handleCopyFromMenu}
            disabled={!contextMenu.hasSelection}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors ${
              contextMenu.hasSelection 
                ? 'hover:bg-[#21262d] text-slate-100 hover:text-white cursor-pointer' 
                : 'text-slate-500 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </span>
            <kbd className="text-[10px] text-slate-400 font-mono">Ctrl+C</kbd>
          </button>

          <button
            type="button"
            onClick={handlePasteFromMenu}
            className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-[#21262d] text-slate-100 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>Colar</span>
            </span>
            <kbd className="text-[10px] text-slate-400 font-mono">Ctrl+V</kbd>
          </button>

          <div className="my-1 border-t border-[#30363d]/70" />

          <button
            type="button"
            onClick={handleSelectAllFromMenu}
            className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-[#21262d] text-slate-100 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Selecionar Tudo</span>
            </span>
            <kbd className="text-[10px] text-slate-400 font-mono">Ctrl+Shift+A</kbd>
          </button>

          <button
            type="button"
            onClick={handleSearchFromMenu}
            className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-[#21262d] text-slate-100 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Buscar no Buffer</span>
            </span>
            <kbd className="text-[10px] text-slate-400 font-mono">Ctrl+F</kbd>
          </button>

          <div className="my-1 border-t border-[#30363d]/70" />

          <button
            type="button"
            onClick={handleClearTerminalFromMenu}
            className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Tela</span>
            </span>
            <kbd className="text-[10px] text-slate-500 font-mono">clear</kbd>
          </button>
        </div>
      )}
    </div>
  );
}
