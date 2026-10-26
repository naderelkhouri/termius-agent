import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  X, 
  Copy, 
  Check, 
  Film, 
  Clock, 
  Gauge, 
  FileText,
  Upload,
  History,
  Trash2,
  FolderOpen,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  downloadCastFile, 
  formatAsAsciicast, 
  parseAsciicast, 
  getRecordingHistory, 
  deleteRecordingFromHistory,
  saveRecordingToHistory 
} from '../services/sessionRecorder';
import { sendNotification } from '../services/notificationService';

export default function SessionReplayModal({ recording: initialRecording, isOpen, onClose }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [activeRecording, setActiveRecording] = useState(initialRecording);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const animationFrameRef = useRef(null);
  const lastTickRef = useRef(0);
  const currentEventIdxRef = useRef(0);
  const currentTimeRef = useRef(0);

  // Sincroniza quando a gravação externa mudar
  useEffect(() => {
    if (initialRecording) {
      setActiveRecording(initialRecording);
    }
  }, [initialRecording]);

  // Carrega histórico quando o modal abre
  useEffect(() => {
    if (isOpen) {
      const history = getRecordingHistory();
      setHistoryList(history);
      if (!activeRecording && history.length > 0) {
        setActiveRecording(history[0]);
      }
    }
  }, [isOpen]);

  const duration = activeRecording?.duration || 0;
  const events = activeRecording?.events || [];

  // Inicializa o terminal de preview
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Limpa conteúdo anterior do container
    containerRef.current.innerHTML = '';

    const term = new Terminal({
      cursorBlink: false,
      fontFamily: '"Fira Code", "JetBrains Mono", Menlo, Monaco, Consolas, monospace',
      fontSize: 12,
      lineHeight: 1.25,
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        selectionBackground: '#264f78',
        black: '#161b22',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
      },
      convertEol: false
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    
    // Fit com pequeno delay para garantir dimensões do modal
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch {}
    });

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Reseta estado
    currentEventIdxRef.current = 0;
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);

    // Se houver eventos, renderiza o frame inicial
    if (events.length > 0 && events[0][0] === 0) {
      term.write(events[0][2]);
      currentEventIdxRef.current = 1;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      term.dispose();
    };
  }, [isOpen, activeRecording]);

  // Loop de reprodução com requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    lastTickRef.current = performance.now();

    const loop = (now) => {
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      const nextTime = currentTimeRef.current + delta * playbackSpeed;

      if (nextTime >= duration) {
        // Chegou ao fim da gravação: escreve todos os eventos restantes
        while (currentEventIdxRef.current < events.length) {
          const ev = events[currentEventIdxRef.current];
          if (termRef.current) termRef.current.write(ev[2]);
          currentEventIdxRef.current++;
        }
        currentTimeRef.current = duration;
        setCurrentTime(duration);
        setIsPlaying(false);
        return;
      }

      // Processa todos os eventos até o tempo atual
      while (currentEventIdxRef.current < events.length) {
        const ev = events[currentEventIdxRef.current];
        const eventTime = ev[0];
        if (eventTime <= nextTime) {
          if (termRef.current) {
            termRef.current.write(ev[2]);
          }
          currentEventIdxRef.current++;
        } else {
          break;
        }
      }

      currentTimeRef.current = nextTime;
      setCurrentTime(nextTime);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, duration, events]);

  // Pular para ponto específico da timeline
  const handleSeek = (targetTime) => {
    if (!termRef.current) return;
    const clampedTime = Math.max(0, Math.min(duration, targetTime));

    // Se voltar no tempo, limpa e reconstrói do início até o tempo desejado
    termRef.current.reset();
    let idx = 0;
    while (idx < events.length) {
      const ev = events[idx];
      if (ev[0] <= clampedTime) {
        termRef.current.write(ev[2]);
        idx++;
      } else {
        break;
      }
    }

    currentEventIdxRef.current = idx;
    currentTimeRef.current = clampedTime;
    setCurrentTime(clampedTime);
  };

  const handleRestart = () => {
    handleSeek(0);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (currentTime >= duration) {
      handleRestart();
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  // Atalhos de teclado no Player
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(currentTimeRef.current - 3);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSeek(currentTimeRef.current + 3);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRestart();
      } else if (e.key === 'Escape') {
        if (showHistory) {
          setShowHistory(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, duration, isPlaying, showHistory]);

  const handleDownload = () => {
    if (!activeRecording) return;
    const titleSlug = (activeRecording.header?.title || 'termius-session')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30);
    const filename = `${titleSlug}-${Date.now()}.cast`;
    downloadCastFile(activeRecording, filename);
    sendNotification({
      title: 'Gravação Exportada',
      body: `Arquivo ${filename} baixado no formato Asciicast v2!`
    });
  };

  const handleCopyJson = () => {
    if (!activeRecording) return;
    const text = formatAsAsciicast(activeRecording);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = parseAsciicast(content);
        saveRecordingToHistory(parsed);
        setActiveRecording(parsed);
        setHistoryList(getRecordingHistory());
        sendNotification({
          title: 'Gravação Carregada',
          body: `Arquivo ${file.name} carregado com sucesso (${parsed.eventCount} eventos)!`
        });
      } catch (err) {
        alert(`Falha ao ler arquivo .cast: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLoadFile(file);
      e.target.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleLoadFile(file);
  };

  const handleDeleteHistoryItem = (e, id) => {
    e.stopPropagation();
    const updated = deleteRecordingFromHistory(id);
    setHistoryList(updated);
    if (activeRecording?.id === id) {
      setActiveRecording(updated[0] || null);
    }
  };

  if (!isOpen) return null;

  const formatTime = (sec) => {
    const safeSec = Math.max(0, sec || 0);
    const mins = Math.floor(safeSec / 60);
    const secs = Math.floor(safeSec % 60);
    const ms = Math.floor((safeSec % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".cast,.json,.txt" 
        className="hidden" 
        onChange={handleFileInputChange}
      />

      <div className={`bg-[#161b22] border rounded-2xl w-full max-w-5xl h-[90vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden transition-all relative ${
        isDragging ? 'border-purple-500 ring-4 ring-purple-500/20' : 'border-[#30363d]'
      }`}>
        {/* Overlay quando arrastando arquivo .cast */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-purple-950/80 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none">
            <Upload className="w-12 h-12 text-purple-300 animate-bounce mb-3" />
            <p className="text-white text-base font-bold">Solte o arquivo .cast aqui para reproduzir</p>
            <p className="text-purple-300 text-xs">Formato Asciicast v2</p>
          </div>
        )}

        {/* Header do Player */}
        <div className="px-5 py-3.5 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-white text-sm font-bold truncate">
                {activeRecording ? `Reprodução: ${activeRecording.header?.title || 'Terminal'}` : 'Player de Sessões Gravadas'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                {activeRecording ? (
                  <>
                    <span>{activeRecording.eventCount} eventos</span>
                    <span>•</span>
                    <span>{duration.toFixed(1)}s duração</span>
                    <span>•</span>
                    <span className="font-mono text-purple-300">Asciicast v2</span>
                  </>
                ) : (
                  <span>Nenhuma sessão carregada</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Abrir Arquivo .cast */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Abrir arquivo de gravação .cast"
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Abrir .cast</span>
            </button>

            {/* Histórico de Gravações */}
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                showHistory 
                  ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                  : 'bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border-[#30363d]'
              }`}
              title="Ver histórico de gravações salvas"
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Gravações</span>
              {historyList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 text-xs font-mono font-bold">
                  {historyList.length}
                </span>
              )}
            </button>

            {activeRecording && (
              <>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  title="Copiar dados brutos Asciicast"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden md:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  title="Download do arquivo .cast (compatível com asciinema player)"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Baixar .cast</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#21262d] rounded-xl transition-colors cursor-pointer ml-1"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corpo Principal: Terminal + Drawer de Histórico */}
        <div className="flex-1 bg-[#0d1117] relative flex overflow-hidden">
          {/* Área do Terminal de Reprodução */}
          <div className="flex-1 h-full relative p-3 overflow-hidden flex flex-col justify-center">
            {activeRecording ? (
              <div ref={containerRef} className="w-full h-full" />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Film className="w-12 h-12 text-purple-400/50 mb-3" />
                <h3 className="text-white text-base font-bold mb-1">Nenhuma gravação selecionada</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Inicie uma gravação usando o botão REC na barra de ferramentas ou abra um arquivo .cast do seu computador.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Selecionar arquivo .cast</span>
                </button>
              </div>
            )}
          </div>

          {/* Drawer Lateral de Histórico de Gravações */}
          {showHistory && (
            <div className="w-72 bg-[#161b22] border-l border-[#30363d] flex flex-col shrink-0 animate-fade-in z-20">
              <div className="px-3.5 py-2.5 border-b border-[#30363d] flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-purple-400" />
                  <span>Gravações Recentes</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {historyList.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#30363d]/40 p-1.5">
                {historyList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Nenhuma gravação salva no histórico.
                  </div>
                ) : (
                  historyList.map((rec) => {
                    const isSelected = activeRecording?.id === rec.id;
                    const dateFormatted = new Date(rec.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <div
                        key={rec.id}
                        onClick={() => {
                          setActiveRecording(rec);
                          setShowHistory(false);
                        }}
                        className={`p-2.5 rounded-xl transition-all cursor-pointer group flex items-start justify-between gap-2 mb-1 ${
                          isSelected
                            ? 'bg-purple-600/20 border border-purple-500/50 text-white'
                            : 'hover:bg-[#21262d] text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-white">
                            {rec.header?.title || 'Terminal'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                            <span>{rec.duration?.toFixed(1) || 0}s</span>
                            <span>•</span>
                            <span>{rec.eventCount} ev</span>
                          </div>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            {dateFormatted}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteHistoryItem(e, rec.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 rounded transition-all cursor-pointer"
                          title="Excluir do histórico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Barra de Controles de Playback & Timeline */}
        {activeRecording && (
          <div className="px-5 py-3 bg-[#161b22] border-t border-[#30363d] flex flex-col gap-2 shrink-0">
            {/* Scrubber / Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-purple-300 w-16 text-right shrink-0">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.05}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1 accent-purple-500 cursor-pointer h-2 bg-[#21262d] rounded-lg"
              />
              <span className="text-xs font-mono font-bold text-slate-400 w-16 shrink-0">
                {formatTime(duration)}
              </span>
            </div>

            {/* Botões de Ação e Velocidade */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestart}
                  className="p-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition-colors cursor-pointer"
                  title="Reiniciar do começo (R)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Badges de Dica de Atalhos */}
                <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 ml-2 font-mono">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[#0d1117] border border-[#30363d]/80 text-slate-300">Espaço</kbd>
                    <span>Play/Pause</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[#0d1117] border border-[#30363d]/80 text-slate-300">← / →</kbd>
                    <span>±3s</span>
                  </span>
                </div>
              </div>

              {/* Velocidade de Reprodução */}
              <div className="flex items-center gap-1.5 bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
                <span className="text-xs text-slate-400 font-semibold px-2 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Velocidade:</span>
                </span>
                {[0.5, 1, 2, 4].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                      playbackSpeed === spd
                        ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
