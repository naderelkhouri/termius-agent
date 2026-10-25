import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  X, 
  Check, 
  RotateCcw, 
  Type, 
  MousePointer, 
  Terminal, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { 
  TERMINAL_THEMES, 
  FONT_SIZE_OPTIONS, 
  CURSOR_STYLE_OPTIONS, 
  DEFAULT_TERMINAL_SETTINGS,
  getThemeDefinition 
} from '../services/terminalThemes';

export default function TerminalThemeModal({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings 
}) {
  const [draftSettings, setDraftSettings] = useState(settings || DEFAULT_TERMINAL_SETTINGS);

  useEffect(() => {
    if (settings) {
      setDraftSettings(settings);
    }
  }, [settings, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTheme = TERMINAL_THEMES.find((t) => t.id === draftSettings.themeId) || TERMINAL_THEMES[0];
  const themeColors = currentTheme.theme;

  const handleSelectTheme = (themeId) => {
    const updated = { ...draftSettings, themeId };
    setDraftSettings(updated);
    if (onUpdateSettings) onUpdateSettings(updated);
  };

  const handleSelectFontSize = (fontSize) => {
    const updated = { ...draftSettings, fontSize };
    setDraftSettings(updated);
    if (onUpdateSettings) onUpdateSettings(updated);
  };

  const handleSelectCursorStyle = (cursorStyle) => {
    const updated = { ...draftSettings, cursorStyle };
    setDraftSettings(updated);
    if (onUpdateSettings) onUpdateSettings(updated);
  };

  const handleToggleCursorBlink = () => {
    const updated = { ...draftSettings, cursorBlink: !draftSettings.cursorBlink };
    setDraftSettings(updated);
    if (onUpdateSettings) onUpdateSettings(updated);
  };

  const handleResetDefaults = () => {
    setDraftSettings(DEFAULT_TERMINAL_SETTINGS);
    if (onUpdateSettings) onUpdateSettings(DEFAULT_TERMINAL_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 
                className="text-white text-sm sm:text-base font-bold flex items-center gap-2"
                style={{ textWrap: 'balance' }}
              >
                <span>Aparência & Temas do Terminal</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {currentTheme.name}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Personalize paleta de cores, tipografia e estilo de cursor para todas as sessões
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#21262d] rounded-xl transition-colors cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Live Preview Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>Pré-visualização em Tempo Real</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                {draftSettings.fontSize}px • Cursor: {draftSettings.cursorStyle} ({draftSettings.cursorBlink ? 'piscante' : 'fixo'})
              </span>
            </div>

            <div 
              className="p-4 rounded-xl border border-[#30363d] shadow-inner font-mono transition-colors duration-200 overflow-x-auto"
              style={{
                backgroundColor: themeColors.background,
                color: themeColors.foreground,
                fontSize: `${draftSettings.fontSize}px`,
                lineHeight: 1.3
              }}
            >
              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/10 text-xs opacity-75">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="truncate">termius-agent — preview@{currentTheme.id}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: themeColors.green }}>nader@nitro</span>
                  <span style={{ color: themeColors.foreground }}>:</span>
                  <span style={{ color: themeColors.blue }}>~/Applications/termius-agent</span>
                  <span style={{ color: themeColors.magenta }}>(main)</span>
                  <span style={{ color: themeColors.foreground }}>$</span>
                  <span style={{ color: themeColors.foreground }}>ls -la --color=auto</span>
                </div>

                <div className="pl-2 space-y-0.5 text-xs opacity-90">
                  <div>
                    <span style={{ color: themeColors.blue }}>drwxr-xr-x</span> 12 nader nader 4096 Oct 24 01:15 <span style={{ color: themeColors.cyan }}>src/</span>
                  </div>
                  <div>
                    <span style={{ color: themeColors.green }}>-rwxr-xr-x</span>  1 nader nader 1024 Oct 24 10:09 <span style={{ color: themeColors.green }}>bin/termius-agent</span>
                  </div>
                  <div>
                    <span style={{ color: themeColors.yellow }}>-rw-r--r--</span>  1 nader nader  850 Oct 24 18:20 <span style={{ color: themeColors.yellow }}>SPEC.md</span>
                  </div>
                  <div>
                    <span style={{ color: themeColors.red }}>-rw-r--r--</span>  1 nader nader 1204 Oct 24 18:22 <span style={{ color: themeColors.red }}>ROADMAP.md</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-1.5">
                  <span style={{ color: themeColors.brightGreen }}>✔</span>
                  <span style={{ color: themeColors.brightYellow }}>[Antigravity]</span>
                  <span style={{ color: themeColors.foreground }}>Sessão pronta e multiplexada com zero latência</span>
                  {/* Cursor Preview */}
                  <span 
                    className={`inline-block ${draftSettings.cursorBlink ? 'animate-pulse' : ''}`}
                    style={{
                      backgroundColor: draftSettings.cursorStyle === 'block' ? themeColors.cursor : 'transparent',
                      color: draftSettings.cursorStyle === 'block' ? themeColors.cursorAccent : themeColors.cursor,
                      borderBottom: draftSettings.cursorStyle === 'underline' ? `2px solid ${themeColors.cursor}` : 'none',
                      borderLeft: draftSettings.cursorStyle === 'bar' ? `2px solid ${themeColors.cursor}` : 'none',
                      width: draftSettings.cursorStyle === 'bar' ? '2px' : '0.6em',
                      height: '1.1em',
                      verticalAlign: 'text-bottom'
                    }}
                  >
                    {draftSettings.cursorStyle === 'block' ? ' ' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Font Size & Cursor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Font Size Selector */}
            <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2.5">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Tamanho da Fonte
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {FONT_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSelectFontSize(size)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
                      draftSettings.fontSize === size
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-[#21262d] text-slate-300 hover:text-white border-[#30363d] hover:bg-[#30363d]'
                    }`}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>

            {/* Cursor Style Selector */}
            <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Estilo de Cursor
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleCursorBlink}
                  className={`text-xs px-2 py-0.5 rounded-md font-semibold border transition-all cursor-pointer ${
                    draftSettings.cursorBlink
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-[#21262d] text-slate-400 border-[#30363d]'
                  }`}
                  title="Alternar entre cursor piscante ou estático"
                >
                  {draftSettings.cursorBlink ? 'Piscante' : 'Estático'}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {CURSOR_STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectCursorStyle(opt.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      draftSettings.cursorStyle === opt.id
                        ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                        : 'bg-[#21262d] text-slate-300 hover:text-white border-[#30363d] hover:bg-[#30363d]'
                    }`}
                  >
                    <span className="font-mono text-sm leading-none">{opt.symbol}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Themes Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>Catálogo de Temas ({TERMINAL_THEMES.length})</span>
              </span>
              <span className="text-xs text-slate-400">
                Clique para ativar imediatamente
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TERMINAL_THEMES.map((t) => {
                const isSelected = draftSettings.themeId === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-[#1c2128] border-purple-500/60 shadow-md ring-1 ring-purple-500/30'
                        : 'bg-[#0d1117] border-[#30363d] hover:border-[#30363d]/80 hover:bg-[#161b22]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-white">
                            {t.name}
                          </span>
                          <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-slate-400 border border-[#30363d]">
                            {t.author}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1 leading-snug">
                          {t.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        {t.previewColors.map((color, idx) => (
                          <span
                            key={idx}
                            className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>

                      <span className="text-xs font-mono text-slate-400 uppercase">
                        {t.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition-colors cursor-pointer"
            title="Restaurar GitHub Dark 13px"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
