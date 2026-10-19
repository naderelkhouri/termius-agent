import React, { useState, useEffect } from 'react';
import { 
  fetchTelemetryMetrics, 
  fetchTelemetryEvents, 
  updateTelemetryEvent, 
  deleteTelemetryEvent, 
  recordTelemetryEvent, 
  triggerAutomatedAnalysis 
} from '../services/api';
import { 
  Activity, 
  Bug, 
  Lightbulb, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Plus, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Wrench,
  RefreshCw
} from 'lucide-react';

export default function TelemetryManager() {
  const [metrics, setMetrics] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'bug' | 'manual_improvement' | 'automated_improvement'
  const [expandedStackId, setExpandedStackId] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'manual_improvement',
    category: 'ui',
    severity: 'medium'
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, e] = await Promise.all([
        fetchTelemetryMetrics(),
        fetchTelemetryEvents({ type: activeTab === 'all' ? null : activeTab, limit: 100 })
      ]);
      setMetrics(m);
      setEvents(e || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'resolved' ? 'open' : 'resolved';
    try {
      await updateTelemetryEvent(item.id, { status: nextStatus });
      loadData();
    } catch (e) {
      alert('Erro ao atualizar status: ' + e.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir este registro de telemetria?')) return;
    try {
      await deleteTelemetryEvent(id);
      loadData();
    } catch (e) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  const handleRunAiAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await triggerAutomatedAnalysis();
      alert(`Análise concluída com sucesso! ${res.count || 0} novas propostas geradas.`);
      loadData();
    } catch (e) {
      alert('Erro ao rodar análise: ' + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await recordTelemetryEvent({
        ...form,
        source: 'user_dashboard'
      });
      setShowAddModal(false);
      setForm({
        title: '',
        message: '',
        type: 'manual_improvement',
        category: 'ui',
        severity: 'medium'
      });
      loadData();
    } catch (err) {
      alert('Erro ao registrar: ' + err.message);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">Crítico</span>;
      case 'high':
        return <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">Alto</span>;
      case 'medium':
        return <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap">Médio</span>;
      default:
        return <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-500/20 text-slate-300 border border-slate-500/30 whitespace-nowrap">Baixo</span>;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'bug':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 whitespace-nowrap">
            <Bug className="w-3.5 h-3.5" />
            Bug
          </span>
        );
      case 'automated_improvement':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 whitespace-nowrap">
            <Cpu className="w-3.5 h-3.5" />
            IA Automatizada
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
            <Lightbulb className="w-3.5 h-3.5" />
            Melhoria Manual
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-slate-100 font-sans">
      {/* Top Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-[#30363d] flex items-center justify-between shrink-0 bg-[#161b22]/80 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 
              className="text-sm sm:text-base font-bold text-white leading-tight truncate"
              style={{ textWrap: 'balance' }}
            >
              Central de Telemetria & Melhorias
            </h1>
            <p className="text-xs text-slate-300 font-medium truncate">
              Rastreamento contínuo de bugs, auto-diagnóstico por IA e backlog ativo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRunAiAnalysis}
            disabled={analyzing}
            className="min-h-[38px] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
            title="Solicitar à IA varredura de melhorias"
          >
            <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{analyzing ? 'Analisando...' : 'Análise IA'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="min-h-[38px] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">Reportar / Sugerir</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards Row */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total de Eventos</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                {metrics.totalEvents}
              </div>
              <div className="text-xs text-slate-400 mt-1">Registrados na base local</div>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Bugs Ativos</span>
                <Bug className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono">
                {metrics.bugs?.open || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {metrics.bugs?.resolved || 0} bugs resolvidos
              </div>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Melhorias Manuais</span>
                <Lightbulb className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
                {metrics.improvements?.manual || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {metrics.improvements?.manualPending || 0} pendentes
              </div>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">IA Auto-Melhorias</span>
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-300 font-mono">
                {metrics.improvements?.automated || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {metrics.improvements?.automatedApplied || 0} auto-aplicadas
              </div>
            </div>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-[#30363d] pb-2 overflow-x-auto">
          {[
            { id: 'all', label: 'Todos os Eventos' },
            { id: 'bug', label: 'Bugs & Falhas' },
            { id: 'manual_improvement', label: 'Melhorias Manuais' },
            { id: 'automated_improvement', label: 'Melhorias por IA' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs font-medium">
            Carregando eventos de telemetria...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs font-semibold bg-[#161b22] rounded-2xl border border-[#30363d]">
            Nenhum evento registrado nesta categoria.
          </div>
        ) : (
          <div className="space-y-3.5">
            {events.map((item) => {
              const isResolved = item.status === 'resolved';
              const isExpanded = expandedStackId === item.id;
              return (
                <div
                  key={item.id}
                  className={`bg-[#161b22] border rounded-2xl p-4 sm:p-5 transition-all shadow-xs ${
                    isResolved 
                      ? 'border-[#30363d] opacity-80' 
                      : item.severity === 'critical'
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : 'border-[#30363d] hover:border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTypeBadge(item.type)}
                      {getSeverityBadge(item.severity)}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase whitespace-nowrap ${
                        isResolved 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-[#21262d] text-slate-300 border border-[#30363d]'
                      }`}>
                        {isResolved ? 'Resolvido' : 'Aberto'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Origem: {item.source}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`min-h-[32px] flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                          isResolved
                            ? 'bg-[#21262d] hover:bg-[#30363d] text-slate-300'
                            : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isResolved ? 'Reabrir' : 'Concluir'}</span>
                      </button>

                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Remover evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 
                    className="text-xs sm:text-sm font-bold text-white mb-1.5"
                    style={{ textWrap: 'balance' }}
                  >
                    {item.title}
                  </h3>

                  {item.message && (
                    <p className="text-xs text-slate-300 leading-relaxed mb-3 font-normal">
                      {item.message}
                    </p>
                  )}

                  {/* AI Diagnostic Box */}
                  {item.aiDiagnostic && (
                    <div className="mt-3 p-3.5 rounded-xl bg-[#0d1117] border border-blue-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-400" />
                          Diagnóstico & Sugestão por IA
                        </span>
                        {item.aiDiagnostic.autoApplied && (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Auto-Aplicada
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>
                          <strong className="text-slate-400">Causa Raiz:</strong> {item.aiDiagnostic.rootCause}
                        </div>
                        <div>
                          <strong className="text-purple-300">Recomendação:</strong> {item.aiDiagnostic.suggestedFix}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Collapsible Stack Trace */}
                  {item.stack && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedStackId(isExpanded ? null : item.id)}
                        className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{isExpanded ? 'Ocultar Stack Trace' : 'Ver Detalhes do Erro / Stack Trace'}</span>
                      </button>

                      {isExpanded && (
                        <pre className="mt-2 p-3 bg-[#0d1117] border border-[#21262d] rounded-xl text-xs font-mono text-rose-300 overflow-x-auto leading-relaxed max-h-48">
                          {item.stack}
                        </pre>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-[#30363d]/50 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-xs">{new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                    <span className="text-xs capitalize font-medium">Categoria: {item.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nova Melhoria Manual */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg p-6 shadow-2xl safe-area-bottom">
            <h2 className="text-sm sm:text-base font-bold text-white mb-4">
              Registrar Melhoria ou Bug Manual
            </h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tipo de Registro
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="manual_improvement">Proposta de Melhoria</option>
                  <option value="bug">Relato de Bug / Falha</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Adicionar atalho de duplicação de aba"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ui">Interface & UX</option>
                    <option value="performance">Performance & I/O</option>
                    <option value="ssh">Conexão & SSH</option>
                    <option value="ai">Inteligência Artificial</option>
                    <option value="security">Segurança</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Severidade / Prioridade
                  </label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Descrição dos Detalhes
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Explique o que aconteceu ou o que pode ser melhorado com clareza..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-base sm:text-xs text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm"
                >
                  Registrar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
