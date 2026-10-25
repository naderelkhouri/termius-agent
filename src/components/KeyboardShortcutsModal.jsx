import React, { useEffect } from 'react';
import { 
  Keyboard, 
  X, 
  Terminal, 
  Columns2, 
  Sparkles, 
  Radio, 
  Search, 
  Zap, 
  Command,
  PanelRight,
  BookOpen,
  Copy,
  MousePointer
} from 'lucide-react';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
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

  const shortcutGroups = [
    {
      category: 'Terminal & Abas',
      icon: Terminal,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      shortcuts: [
        { keys: ['Ctrl', 'Shift', 'T'], description: 'Abrir nova aba de terminal local' },
        { keys: ['Ctrl', 'Shift', 'W'], description: 'Fechar a aba de terminal ativa' },
        { keys: ['Ctrl', 'B'], description: 'Alternar entre Modo FOCO (apenas terminais) e Modo Expansivo' },
        { keys: ['Modos'], description: 'Alternar entre FOCO (100% terminais), Expansivo (tudo à mostra) e Custom' },
        { keys: ['Custom ⚙️'], description: 'Menu Multiseletor para escolher quais barras e componentes exibir' },
        { keys: ['Alt', '1...9'], description: 'Alternar diretamente para a aba 1 a 9' },
        { keys: ['Ctrl', 'PgUp', 'ou', 'PgDn'], description: 'Navegar para aba anterior ou próxima' },
        { keys: ['Scroll do Mouse'], description: 'Navegar/Alternar entre as abas na barra superior' },
        { keys: ['Shift', 'Scroll'], description: 'Rolar a barra de abas horizontalmente' },
        { keys: ['Ctrl', 'F'], description: 'Buscar texto no buffer do terminal (In-Buffer Find)' },
        { keys: ['Enter'], description: 'Próxima ocorrência na busca do terminal' },
        { keys: ['Shift', 'Enter'], description: 'Ocorrência anterior na busca do terminal' },
        { keys: ['Duplo-clique'], description: 'Renomear título da aba ativa' },
        { keys: ['Botão Direito na Aba'], description: 'Menu de contexto da aba (mudar cor, duplicar, fechar outras)' }
      ]
    },
    {
      category: 'Copiar, Colar & Seleção',
      icon: Copy,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      shortcuts: [
        { keys: ['Ctrl', 'C'], description: 'Copiar seleção (ou enviar SIGINT se sem seleção)' },
        { keys: ['Ctrl', 'V'], description: 'Colar da área de transferência (sem travar terminal)' },
        { keys: ['Ctrl', 'Shift', 'C', 'ou', 'V'], description: 'Copiar e colar no formato clássico terminal' },
        { keys: ['Ctrl', 'Shift', 'A'], description: 'Selecionar todo o texto do terminal ativo' },
        { keys: ['Botão Direito'], description: 'Menu de contexto flutuante com ações rápidas' },
        { keys: ['Botão do Meio'], description: 'Colar rápido via clique central do mouse' }
      ]
    },
    {
      category: 'Divisão de Tela (Split Screen)',
      icon: Columns2,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      shortcuts: [
        { keys: ['Ctrl', 'Alt', 'V'], description: 'Dividir tela verticalmente (2 terminais lado a lado)' },
        { keys: ['Ctrl', 'Alt', 'H'], description: 'Dividir tela horizontalmente (2 terminais empilhados)' },
        { keys: ['Clique na Aba'], description: 'Alternar foco entre os painéis divididos' }
      ]
    },
    {
      category: 'IA, Agentes & Copilot',
      icon: Sparkles,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      shortcuts: [
        { keys: ['Ctrl', 'K'], description: 'Abrir AI Copilot flutuante com sugestões de comando' },
        { keys: ['Ctrl', 'Alt', 'A'], description: 'Alternar painel acoplado do AI Sidecar ao vivo' },
        { keys: ['Ctrl', 'Shift', 'S'], description: 'Abrir catálogo com 340 Skills IA em Português BR' },
        { keys: ['Botão ↓'], description: 'Rolar instantaneamente até as mensagens mais recentes do chat IA' }
      ]
    },
    {
      category: 'Automação & Cluster',
      icon: Radio,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      shortcuts: [
        { keys: ['Ctrl', 'Shift', 'B'], description: 'Alternar Cluster Broadcast (espelhamento multi-host)' },
        { keys: ['Ctrl', 'Espaço'], description: 'Abrir Smart Command Bar (autocomplete contextual)' },
        { keys: ['F1', 'ou', '?'], description: 'Abrir esta Central de Atalhos de Teclado' },
        { keys: ['Esc'], description: 'Fechar modais, popovers e barra de pesquisa' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 
                className="text-white text-sm sm:text-base font-bold flex items-center gap-2"
                style={{ textWrap: 'balance' }}
              >
                <span>Central de Atalhos de Teclado</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Cheat Sheet
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Guia rápido de comandos e navegação de alta velocidade no Termius Agent
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

        {/* Shortcuts Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortcutGroups.map((group) => {
              const Icon = group.icon;
              return (
                <div
                  key={group.category}
                  className="bg-[#0d1117]/80 border border-[#30363d] rounded-2xl p-4 flex flex-col justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-[#21262d]">
                    <div className={`w-7 h-7 rounded-lg ${group.bgColor} border ${group.borderColor} flex items-center justify-center ${group.color} shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                      {group.category}
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {group.shortcuts.map((sc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-slate-300 font-medium leading-relaxed truncate pr-1">
                          {sc.description}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {sc.keys.map((k, kIdx) => (
                            <React.Fragment key={kIdx}>
                              {k === 'ou' ? (
                                <span className="text-xs text-slate-400 font-sans px-1">ou</span>
                              ) : (
                                <kbd className="px-2 py-0.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] font-mono text-xs font-bold text-slate-200 shadow-xs transition-colors whitespace-nowrap min-w-[24px] text-center">
                                  {k}
                                </kbd>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Pressione <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] font-mono font-bold text-slate-300">F1</kbd> a qualquer momento para abrir esta central</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
