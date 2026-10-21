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
  FileText 
} from 'lucide-react';
import { downloadCastFile, formatAsAsciicast } from '../services/sessionRecorder';
import { sendNotification } from '../services/notificationService';

export default function SessionReplayModal({ recording, isOpen, onClose }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [copied, setCopied] = useState(false);

  const animationFrameRef = useRef(null);
  const lastTickRef = useRef(0);
  const currentEventIdxRef = useRef(0);
  const currentTimeRef = useRef(0);

  const duration = recording?.duration || 0;
  const events = recording?.events || [];

  // Inicializa o terminal de preview
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

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
    fitAddon.fit();

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
  }, [isOpen, recording]);

  // Loop de reprodução
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

    // Se o usuário voltar no tempo, limpa e reconstrói do início até o tempo desejado
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

  const handleDownload = () => {
    if (!recording) return;
    const titleSlug = (recording.header?.title || 'termius-session')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30);
    const filename = `${titleSlug}-${Date.now()}.cast`;
    downloadCastFile(recording, filename);
    sendNotification({
      title: 'Gravação Exportada',
      body: `Arquivo ${filename} baixado no formato Asciicast v2!`
    });
  };

  const handleCopyJson = () => {
    if (!recording) return;
    const text = formatAsAsciicast(recording);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !recording) return null;

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-5xl h-[90vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header do Player */}
        <div className="px-5 py-3.5 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-white text-sm font-bold truncate">
                Reprodução de Sessão: {recording.header?.title || 'Terminal'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>{recording.eventCount} eventos</span>
                <span>•</span>
                <span>{duration.toFixed(1)}s duração</span>
                <span>•</span>
                <span className="font-mono text-purple-300">Asciicast v2</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Copiar dados brutos Asciicast"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar .cast'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Download do arquivo .cast (compatível com asciinema player)"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Baixar .cast</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#21262d] rounded-xl transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Área do Terminal de Reprodução */}
        <div className="flex-1 bg-[#0d1117] relative p-3 overflow-hidden">
          <div ref={containerRef} className="w-full h-full" />
        </div>

        {/* Barra de Controles de Playback & Timeline */}
        <div className="px-5 py-3.5 bg-[#161b22] border-t border-[#30363d] flex flex-col gap-2.5 shrink-0">
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

          {/* Botões de Ação */}
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
                title="Reiniciar do começo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
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
      </div>
    </div>
  );
}
