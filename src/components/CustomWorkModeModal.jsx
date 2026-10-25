import React, { useEffect } from 'react';
import { 
  Sliders, 
  X, 
  Check, 
  RotateCcw, 
  PanelLeft, 
  Terminal, 
  Sparkles, 
  Layers, 
  BotMessageSquare, 
  Columns2,
  SlidersHorizontal,
  Bookmark,
  Activity,
  CheckCheck
} from 'lucide-react';

export default function CustomWorkModeModal({ 
  isOpen, 
  onClose, 
  config, 
  onUpdateConfig, 
  onResetDefault,
  onSelectAll,
  onSelectMinimal,
  onActivateCustomMode,
  isCustomActive
}) {
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

  const options = [
    {
      key: 'showSidebar',
      icon: PanelLeft,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      title: 'Barra Lateral Esquerda (Sidebar)',
      description: 'Exibir ou ocultar a coluna esquerda de navegação do app'
    },
    {
      key: 'sidebarCompact',
      icon: SlidersHorizontal,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      title: 'Estilo da Sidebar: Apenas Ícones (Compacto)',
      description: 'Reduz a largura da barra lateral a 64px com foco nos ícones e tooltips',
      disabled: !config.showSidebar
    },
    {
      key: 'showActiveSessions',
      icon: Layers,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      title: 'Lista de Sessões Ativas na Sidebar',
      description: 'Exibe os terminais abertos com títulos e cores na barra lateral',
      disabled: !config.showSidebar || config.sidebarCompact
    },
    {
      key: 'showAiBanners',
      icon: Sparkles,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      title: 'Banners de IA (Skills & Retomar Sessão)',
      description: 'Atalhos rápidos para catálogo de 340 skills e retomar conversa no terminal',
      disabled: !config.showSidebar || config.sidebarCompact
    },
    {
      key: 'showSmartBar',
      icon: Terminal,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      title: 'Smart Command Bar (Autocomplete Preditivo)',
      description: 'Barra de sugestões contextuais e histórico de comandos no rodapé do terminal'
    },
    {
      key: 'showSidecar',
      icon: BotMessageSquare,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      title: 'AI Sidecar Acoplado ao Vivo',
      description: 'Painel lateral persistente com chat, timeline e comandos do Antigravity'
    },
    {
      key: 'showStatusBar',
      icon: Activity,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      title: 'Barra de Status Inferior do Sistema',
      description: 'Rodapé com status do host, diretório CWD (clique para copiar), tema e REC'
    },
    {
      key: 'showTopActions',
      icon: Bookmark,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      title: 'Ações na Barra Superior (Top Actions)',
      description: 'Botões de catálogo de Skills IA, AI Copilot flutuante e menu de ferramentas'
    },
    {
      key: 'showSplitControls',
      icon: Columns2,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      title: 'Controles de Divisão de Tela (Split Screen)',
      description: 'Botões para alternar entre terminal único, divisão vertical e horizontal'
    }
  ];

  const activeCount = Object.values(config).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white text-sm sm:text-base font-bold flex items-center gap-2">
                <span>Configuração do Modo Custom</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Multiseletor ({activeCount}/{options.length})
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Selecione os elementos de interface que devem ficar visíveis no Modo Personalizado
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

        {/* Quick Presets Bar */}
        <div className="px-5 py-2.5 bg-[#161b22] border-b border-[#30363d]/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Predefinições Rápidas:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSelectAll}
              className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Marcar Tudo</span>
            </button>

            <button
              type="button"
              onClick={onSelectMinimal}
              className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Mínimo Essencial</span>
            </button>

            <button
              type="button"
              onClick={onResetDefault}
              className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="Restaurar padrão do modo Custom"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span>Padrão</span>
            </button>
          </div>
        </div>

        {/* Options List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isChecked = Boolean(config[opt.key]);
            const isDisabled = Boolean(opt.disabled);

            return (
              <div
                key={opt.key}
                onClick={() => {
                  if (!isDisabled) {
                    onUpdateConfig(opt.key, !isChecked);
                  }
                }}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isDisabled 
                    ? 'opacity-40 bg-[#0d1117]/40 border-[#21262d] cursor-not-allowed'
                    : isChecked
                    ? 'bg-[#0d1117] border-amber-500/40 hover:border-amber-500/60 cursor-pointer shadow-xs'
                    : 'bg-[#0d1117]/60 border-[#30363d]/60 hover:border-[#30363d] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg ${opt.bgColor} flex items-center justify-center ${opt.color} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{opt.title}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-normal leading-relaxed truncate">
                      {opt.description}
                    </div>
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <div className="shrink-0 flex items-center">
                  <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    isDisabled 
                      ? 'bg-[#21262d]'
                      : isChecked 
                      ? 'bg-amber-600' 
                      : 'bg-[#21262d] border border-[#30363d]'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform flex items-center justify-center ${
                      isChecked ? 'translate-x-5' : 'translate-x-0'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 text-amber-700 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div>
            {!isCustomActive && (
              <button
                type="button"
                onClick={() => {
                  if (onActivateCustomMode) onActivateCustomMode();
                  onClose();
                }}
                className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                ⚡ Ativar Modo Custom Agora
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              Concluir & Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
