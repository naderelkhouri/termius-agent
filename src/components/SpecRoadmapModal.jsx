import React, { useState, useEffect } from 'react';
import { fetchSpecAndRoadmap, saveSpecAndRoadmap, exportSpecAndRoadmap } from '../services/api';
import { 
  FileText, 
  Milestone, 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  Target, 
  FileCode2, 
  X, 
  RotateCcw, 
  Sparkles,
  ArrowRight,
  Terminal,
  Zap,
  Folder,
  Download,
  Check
} from 'lucide-react';

export default function SpecRoadmapModal({
  conversationId,
  conversationTitle,
  isOpen,
  onClose,
  onResumeConversation
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [activeTab, setActiveTab] = useState('spec'); // 'spec' | 'roadmap'

  useEffect(() => {
    if (isOpen && conversationId) {
      loadData(conversationId);
    }
  }, [isOpen, conversationId]);

  const loadData = async (convId) => {
    setLoading(true);
    try {
      const res = await fetchSpecAndRoadmap(convId);
      setData(res);
    } catch (err) {
      console.error('[SpecRoadmapModal] Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (milestoneId, taskIndex) => {
    if (!data || !conversationId) return;
    const nextMilestones = data.roadmap.milestones.map((m) => {
      if (m.id !== milestoneId) return m;
      const nextTasks = m.tasks.map((t, idx) => {
        if (idx !== taskIndex) return t;
        return { ...t, completed: !t.completed };
      });
      const completedCount = nextTasks.filter((t) => t.completed).length;
      const prog = nextTasks.length > 0 ? Math.round((completedCount / nextTasks.length) * 100) : 0;
      return {
        ...m,
        tasks: nextTasks,
        progress: prog,
        status: prog === 100 ? 'completed' : prog > 0 ? 'in_progress' : 'planned'
      };
    });

    const totalTasks = nextMilestones.reduce((acc, m) => acc + m.tasks.length, 0);
    const completedTasks = nextMilestones.reduce((acc, m) => acc + m.tasks.filter((t) => t.completed).length, 0);
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const updated = {
      ...data,
      overallProgress,
      roadmap: {
        ...data.roadmap,
        overallProgress,
        milestones: nextMilestones
      }
    };

    setData(updated);
    try {
      await saveSpecAndRoadmap(conversationId, updated);
    } catch (err) {
      console.warn('[SpecRoadmapModal] Erro ao salvar:', err);
    }
  };

  const handleExport = async () => {
    if (!conversationId) return;
    setExporting(true);
    setExportResult(null);
    try {
      const res = await exportSpecAndRoadmap(conversationId);
      setExportResult(res);
      setTimeout(() => setExportResult(null), 8000);
    } catch (err) {
      alert(`Falha ao exportar Markdown: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none font-sans animate-fade-in">
      <div 
        className="w-full max-w-4xl h-[88vh] bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="h-16 px-5 bg-[#1c2128] border-b border-[#30363d] flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2 truncate">
                Spec & Roadmap da Sessão
                {data && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {data.overallProgress}% Concluído
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {conversationTitle || data?.title || 'Sessão Antigravity'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onResumeConversation && (
              <button
                type="button"
                onClick={() => {
                  onResumeConversation(conversationId, conversationTitle || 'Sessão IA');
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Abrir no Terminal</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Spec vs Roadmap */}
        <div className="px-5 pt-3 pb-2 border-b border-[#30363d] bg-[#0d1117] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('spec')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'spec'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Especificação Técnica (Spec)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'roadmap'
                  ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Milestone className="w-4 h-4 text-blue-400" />
              <span>Plano de Evolução (Roadmap)</span>
              {data && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 font-semibold whitespace-nowrap">
                  {data.overallProgress}%
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || !data}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all active:scale-95 shadow-xs whitespace-nowrap disabled:opacity-50"
              title="Gerar SPEC.md e ROADMAP.md na raiz do projeto com 1 clique"
            >
              {exportResult ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Exportado!</span>
                </>
              ) : (
                <>
                  <Download className={`w-3.5 h-3.5 text-purple-400 ${exporting ? 'animate-bounce' : ''}`} />
                  <span>{exporting ? 'Exportando...' : 'Exportar Markdown'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => conversationId && loadData(conversationId)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              title="Recalcular"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              <span className="hidden sm:inline">Recalcular</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 select-text bg-[#0d1117]">
          {/* Export Success Notification Banner */}
          {exportResult && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3 font-mono shadow-xs">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Markdown exportado com sucesso: <strong>{exportResult.targetDir}</strong> (<code>SPEC.md</code> &amp; <code>ROADMAP.md</code>)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExportResult(null)}
                className="text-emerald-400 hover:text-white shrink-0 p-1 rounded hover:bg-emerald-900/50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs font-semibold gap-2">
              <RotateCcw className="w-6 h-6 animate-spin text-purple-400" />
              <span>Sintetizando Spec e Roadmap dinâmicos do cérebro da IA...</span>
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-slate-500 text-xs font-semibold">
              Não foi possível gerar a especificação desta conversa.
            </div>
          ) : activeTab === 'spec' ? (
            /* Spec View */
            <div className="space-y-4">
              {/* Card 1: Objetivo Central & Escopo */}
              <div className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#21262d]">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Objetivo Central & Escopo da Sessão
                  </span>
                </div>
                <h4 className="text-sm font-bold text-amber-200 mb-2 leading-snug">
                  {data.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {data.spec.objective}
                </p>

                {/* Stack */}
                <div className="mt-3 pt-3 border-t border-[#21262d]">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-2">
                    Stack & Tecnologias Detectadas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.spec.techStack?.map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/25"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Requisitos Funcionais */}
              <div className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-xs">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#21262d]">
                  <ListTodo className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Requisitos Identificados ({data.spec.functionalRequirements?.length || 0})
                  </span>
                </div>

                <div className="space-y-2">
                  {data.spec.functionalRequirements?.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-100 block leading-snug">
                          {req.title}
                        </span>
                        {req.fullText && req.fullText !== req.title && (
                          <span className="text-xs text-slate-400 block mt-1 line-clamp-2 select-text font-mono">
                            {req.fullText}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Decisões de Arquitetura */}
              <div className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#21262d]">
                  <Target className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Decisões de Engenharia & Arquitetura
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 mt-2">
                  {data.spec.architecturalDecisions?.map((dec, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                      <span>{dec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 4: Arquivos Afetados */}
              <div className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#21262d]">
                  <FileCode2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Arquivos Afetados ({data.spec.affectedFiles?.length || 0})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {data.spec.affectedFiles?.map((f, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-[#0d1117] text-xs font-mono text-slate-300 truncate flex items-center justify-between border border-[#30363d]/60"
                    >
                      <span className="truncate">{f.path.replace('/home/nader', '~')}</span>
                      <span className="text-xs text-purple-300 font-semibold shrink-0 ml-2 whitespace-nowrap">modificado</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Roadmap View */
            <div className="space-y-4">
              {/* Overall Progress Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-[#161b22] border border-blue-500/30 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Milestone className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Status de Conclusão do Projeto
                    </span>
                  </div>
                  <span className="text-base font-extrabold font-mono text-blue-300">
                    {data.overallProgress}% Concluído
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-[#21262d] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${data.overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-3">
                {data.roadmap.milestones?.map((m) => {
                  const isDone = m.status === 'completed' || m.progress === 100;
                  const inProgress = m.status === 'in_progress';

                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3 pb-2.5 border-b border-[#21262d]">
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : inProgress ? (
                              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                            ) : (
                              <Milestone className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span>{m.title}</span>
                          </h5>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                            {m.description}
                          </p>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase font-mono shrink-0 ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : inProgress
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isDone ? '100% OK' : inProgress ? `${m.progress}% Ativo` : 'Planejado'}
                        </span>
                      </div>

                      {/* Checklist */}
                      <div className="space-y-2">
                        {m.tasks.map((task, taskIdx) => (
                          <div
                            key={taskIdx}
                            onClick={() => handleToggleTask(m.id, taskIdx)}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#0d1117] cursor-pointer transition-colors text-xs select-none"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(task.completed)}
                              onChange={() => {}}
                              className="rounded border-[#30363d] text-purple-600 focus:ring-0 focus:ring-offset-0 bg-[#161b22] cursor-pointer w-4 h-4"
                            />
                            <span
                              className={`truncate leading-snug ${
                                task.completed
                                  ? 'line-through text-slate-500'
                                  : 'text-slate-200 font-medium'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Next Steps */}
              {data.roadmap.nextActions?.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-xs">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#21262d]">
                    <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Próximos Passos Recomendados
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 mt-2">
                    {data.roadmap.nextActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                        <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
