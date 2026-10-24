import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { Zap, Search, ChevronUp, ChevronDown, X as XIcon } from 'lucide-react';
import { sendNotification } from '../services/notificationService';
import { recordOutput } from '../services/sessionRecorder';

export default function TerminalView({ 
  tab, 
  onTitleChange, 
  isActive, 
  onRegisterCommander,
  onBroadcastInput,
  isBroadcastActive,
  isBroadcastOrigin,
  isBroadcastTarget
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

    // Initialize Xterm
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Fira Code", "JetBrains Mono", Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.25,
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        selectionBackground: '#264f78',
        black: '#161b22',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#f0f6fc',
      },
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
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        if (event.type === 'keydown') {
          setSearchOpen((prev) => !prev);
        }
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

  return (
    <div 
      className={`h-full w-full bg-[#0d1117] relative group ${isActive ? 'block' : 'hidden'}`}
      ref={containerRef}
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
    </div>
  );
}
