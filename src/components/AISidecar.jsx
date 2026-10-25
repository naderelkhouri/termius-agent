import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  fetchConversations, 
  fetchTranscript,
  fetchFavorites,
  fetchFluidConversations,
  addFluidConversation,
  removeFluidConversation,
  fetchSpecAndRoadmap,
  saveSpecAndRoadmap,
  exportSpecAndRoadmap
} from '../services/api';
import { sendNotification } from '../services/notificationService';
import { 
  BotMessageSquare, 
  RotateCcw, 
  X, 
  Play, 
  Copy, 
  Check, 
  Terminal, 
  FileCode2, 
  Zap, 
  Folder, 
  ChevronDown, 
  ChevronRight,
  ArrowDown,
  Sparkles,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  FileText,
  Milestone,
  CheckCircle2,
  Clock,
  ListTodo,
  Target,
  Download
} from 'lucide-react';

function extractCommandLine(tc) {
  if (!tc) return '';
  const args = tc.args || tc.arguments || {};
  let raw = args.CommandLine || args.command || args.cmd || tc.CommandLine || tc.command || '';
  if (!raw && typeof args === 'string') {
    raw = args;
  }
  if (!raw && tc.argumentsJson) {
    try {
      const parsed = JSON.parse(tc.argumentsJson);
      raw = parsed.CommandLine || parsed.command || parsed.cmd || '';
    } catch {}
  }
  if (!raw) return '';

  if (typeof raw === 'string') {
    raw = raw.trim();
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      try {
        const unquoted = JSON.parse(raw);
        if (typeof unquoted === 'string') return unquoted;
      } catch {
        return raw.slice(1, -1);
      }
    }
  }
  return String(raw);
}

function extractFilePath(tc) {
  if (!tc) return '';
  const args = tc.args || tc.arguments || {};
  return args.Path || args.path || tc.Path || tc.path || '';
}

export default function AISidecar({ 
  onClose, 
  onExecuteCommand, 
  activeTab, 
  onResumeConversation 
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [specRoadmap, setSpecRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [specLoading, setSpecLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'commands' | 'files' | 'spec' | 'roadmap'
  const [copiedKey, setCopiedKey] = useState(null);
  const [exportingSpec, setExportingSpec] = useState(false);
  const [exportSpecSuccess, setExportSpecSuccess] = useState(false);
  const [fluidConversations, setFluidConversations] = useState([]);
  const [convDropdownOpen, setConvDropdownOpen] = useState(false);
  const [convSearch, setConvSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Se a distância até o fim for maior que 80px, exibe o botão
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 80);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    setShowScrollBottom(false);
  };

  // Carrega lista de conversas e modo fluido
  useEffect(() => {
    loadConversations();
    fetchFluidConversations().then((fluids) => {
      if (Array.isArray(fluids)) setFluidConversations(fluids);
    }).catch(() => {});
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await fetchConversations({ limit: 40 });
      const list = data.conversations || [];
      setConversations(list);

      // Prioridade 1: ID da conversa vinculado à aba ativa (se houver)
      if (activeTab?.conversationId) {
        setSelectedConvId(activeTab.conversationId);
      } else if (!selectedConvId && list.length > 0) {
        // Prioridade 2: Primeira conversa mais recente
        setSelectedConvId(list[0].conversation_id);
      }
    } catch (err) {
      console.error('[AISidecar] Erro ao carregar conversas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Se a aba ativa mudar e tiver conversa vinculada, sincroniza o Sidecar
  useEffect(() => {
    if (activeTab?.conversationId && activeTab.conversationId !== selectedConvId) {
      setSelectedConvId(activeTab.conversationId);
    }
  }, [activeTab?.conversationId]);

  // Carrega transcript e spec/roadmap da conversa selecionada
  useEffect(() => {
    if (!selectedConvId) return;
    loadTranscript(selectedConvId);
    loadSpecAndRoadmap(selectedConvId);
  }, [selectedConvId]);

  const loadTranscript = async (convId) => {
    setTranscriptLoading(true);
    try {
      const data = await fetchTranscript(convId);
      setTranscript(data.steps || []);
    } catch (err) {
      console.error('[AISidecar] Erro ao carregar transcript:', err);
      setTranscript([]);
    } finally {
      setTranscriptLoading(false);
    }
  };

  const loadSpecAndRoadmap = async (convId) => {
    setSpecLoading(true);
    try {
      const data = await fetchSpecAndRoadmap(convId);
      setSpecRoadmap(data);
    } catch (err) {
      console.error('[AISidecar] Erro ao carregar spec/roadmap:', err);
    } finally {
      setSpecLoading(false);
    }
  };

  const handleToggleTask = async (milestoneId, taskIndex) => {
    if (!specRoadmap || !selectedConvId) return;
    const nextMilestones = specRoadmap.roadmap.milestones.map((m) => {
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
      ...specRoadmap,
      overallProgress,
      roadmap: {
        ...specRoadmap.roadmap,
        overallProgress,
        milestones: nextMilestones
      }
    };

    setSpecRoadmap(updated);
    try {
      await saveSpecAndRoadmap(selectedConvId, updated);
    } catch (err) {
      console.warn('[AISidecar] Erro ao salvar roadmap:', err);
    }
  };

  const handleExportSpecRoadmap = async () => {
    if (!selectedConvId) return;
    setExportingSpec(true);
    setExportSpecSuccess(false);
    try {
      await exportSpecAndRoadmap(selectedConvId);
      setExportSpecSuccess(true);
      sendNotification({
        title: 'Spec & Roadmap Exportados',
        body: 'Arquivos SPEC.md e ROADMAP.md gerados com sucesso na raiz do projeto!'
      });
      setTimeout(() => setExportSpecSuccess(false), 6000);
    } catch (err) {
      alert(`Erro ao exportar Markdown: ${err.message}`);
    } finally {
      setExportingSpec(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const selectedConv = useMemo(() => {
    return conversations.find((c) => c.conversation_id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  const isFluid = useMemo(() => {
    return selectedConvId ? fluidConversations.includes(selectedConvId) : false;
  }, [selectedConvId, fluidConversations]);

  const toggleFluid = async (convId) => {
    if (!convId) return;
    const currentIsFluid = fluidConversations.includes(convId);
    const nextFluids = currentIsFluid 
      ? fluidConversations.filter((id) => id !== convId)
      : [...fluidConversations, convId];
    
    setFluidConversations(nextFluids);
    try {
      localStorage.setItem('termius_fluid_conversations', JSON.stringify(nextFluids));
    } catch {}

    try {
      if (currentIsFluid) {
        await removeFluidConversation(convId);
      } else {
        await addFluidConversation(convId);
      }
    } catch (err) {
      console.warn('[AISidecar] Erro ao sincronizar modo fluido:', err);
    }
  };

  // Extrai lista plana de comandos e arquivos para abas rápidas
  const { allCommands, allFiles } = useMemo(() => {
    const commands = [];
    const files = [];

    transcript.forEach((step, stepIdx) => {
      if (step.toolCalls && Array.isArray(step.toolCalls)) {
        step.toolCalls.forEach((tc, tcIdx) => {
          const cmdLine = extractCommandLine(tc);
          const filePath = extractFilePath(tc);

          if (cmdLine) {
            commands.push({
              key: `cmd-${stepIdx}-${tcIdx}`,
              stepIndex: step.stepIndex,
              name: tc.name,
              command: cmdLine,
              createdAt: step.createdAt
            });
          }

          if (filePath) {
            files.push({
              key: `file-${stepIdx}-${tcIdx}`,
              stepIndex: step.stepIndex,
              name: tc.name,
              path: filePath,
              args: tc.args || tc.arguments || {},
              createdAt: step.createdAt
            });
          }
        });
      }
    });

    return { allCommands: commands, allFiles: files };
  }, [transcript]);

  // Filtra conversas para o menu dropdown
  const filteredConversations = useMemo(() => {
    if (!convSearch.trim()) return conversations;
    const term = convSearch.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(term)) ||
        (c.preview && c.preview.toLowerCase().includes(term)) ||
        (c.workspace && c.workspace.toLowerCase().includes(term))
    );
  }, [conversations, convSearch]);

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <aside className="h-full w-full flex flex-col bg-[#161b22] text-slate-100 select-none overflow-hidden font-sans border-l border-[#30363d]">
      {/* Top Header */}
      <div className="h-14 px-3.5 border-b border-[#30363d] flex items-center justify-between shrink-0 bg-[#1c2128]/90 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
            <BotMessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <span 
              className="text-xs font-bold text-white flex items-center gap-1.5 truncate"
              style={{ textWrap: 'balance' }}
            >
              AI Sidecar
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold whitespace-nowrap">
                Ao Vivo
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Toggle Modo Fluido */}
          {selectedConvId && (
            <button
              type="button"
              onClick={() => toggleFluid(selectedConvId)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                isFluid
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-[#21262d] text-slate-400 border-[#30363d] hover:text-white'
              }`}
              title={isFluid ? "Modo Fluido ATIVO: Auto-aprova confirmações do Antigravity" : "Ativar Modo Fluido"}
            >
              <Zap className={`w-3.5 h-3.5 ${isFluid ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-xs font-semibold hidden sm:inline">{isFluid ? 'Fluido' : 'Normal'}</span>
            </button>
          )}

          {/* Botão Atualizar */}
          <button
            type="button"
            onClick={() => selectedConvId && (loadTranscript(selectedConvId), loadSpecAndRoadmap(selectedConvId))}
            className="w-8 h-8 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            title="Atualizar passos e roadmap da conversa"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${transcriptLoading || specLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          {/* Botão Fechar Sidecar */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#21262d] hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-colors active:scale-95"
            title="Fechar Sidecar (Ctrl + Alt + A)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversation Selector Bar */}
      <div className="px-3 py-2 border-b border-[#30363d] bg-[#0d1117]/60 relative">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setConvDropdownOpen((prev) => !prev)}
            className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-left transition-colors min-w-0"
          >
            <div className="min-w-0 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200 truncate">
                {selectedConv ? selectedConv.title || selectedConv.preview || 'Conversa sem título' : 'Selecionar conversa...'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
          </button>

          {selectedConvId && (
            <button
              type="button"
              onClick={() => {
                if (onResumeConversation && selectedConv) {
                  onResumeConversation(
                    selectedConv.conversation_id,
                    selectedConv.title || 'Conversa IA',
                    selectedConv.workspace || '/home/nader',
                    isFluid
                  );
                }
              }}
              className="p-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 hover:text-white border border-purple-500/40 transition-all shrink-0 active:scale-95"
              title="Abrir esta conversa em uma nova aba de terminal"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Menu de Conversas */}
        {convDropdownOpen && (
          <div className="absolute top-full left-3 right-3 mt-1.5 z-30 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-72">
            <div className="p-2 border-b border-[#30363d] bg-[#0d1117]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                  placeholder="Pesquisar conversas..."
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-8 pr-2.5 py-1 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-1.5 space-y-1 divide-y divide-[#21262d]">
              {filteredConversations.map((c) => {
                const isSelected = c.conversation_id === selectedConvId;
                return (
                  <button
                    key={c.conversation_id}
                    type="button"
                    onClick={() => {
                      setSelectedConvId(c.conversation_id);
                      setConvDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-start gap-2 ${
                      isSelected
                        ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                        : 'hover:bg-[#21262d] text-slate-300'
                    }`}
                  >
                    <BotMessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-200 truncate leading-snug">
                        {c.title || c.preview || 'Sem título'}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                        {c.step_count} steps • {c.workspace ? c.workspace.replace('/home/nader', '~') : '~'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs: Timeline | Comandos | Arquivos | Spec | Roadmap */}
      <div className="px-3 pt-2 pb-1.5 border-b border-[#30363d] flex items-center justify-between bg-[#161b22] shrink-0 overflow-x-auto scrollbar-none [mask-image:linear-gradient(to_right,white_calc(100%-16px),transparent)]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Timeline ({transcript.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('commands')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeFilter === 'commands'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>Cmds ({allCommands.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('files')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeFilter === 'files'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode2 className="w-3 h-3 text-emerald-400" />
            <span>Diffs ({allFiles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('spec')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeFilter === 'spec'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3 h-3 text-amber-400" />
            <span>Spec</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('roadmap')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeFilter === 'roadmap'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Milestone className="w-3 h-3 text-blue-400" />
            <span>Roadmap</span>
            {specRoadmap && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 font-semibold whitespace-nowrap">
                {specRoadmap.overallProgress}%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Sidecar Content with Floating Scroll-to-Bottom Button */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 space-y-3.5 select-text scroll-smooth"
        >
        {transcriptLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs font-semibold gap-2">
            <RotateCcw className="w-5 h-5 animate-spin text-purple-400" />
            <span>Sincronizando passos com o Antigravity...</span>
          </div>
        ) : transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs text-center p-4">
            <BotMessageSquare className="w-8 h-8 text-slate-600 mb-2" />
            <p>Nenhum passo registrado nesta sessão ainda.</p>
          </div>
        ) : activeFilter === 'commands' ? (
          /* View Apenas Comandos */
          allCommands.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              Nenhum comando bash executado nesta sessão.
            </div>
          ) : (
            allCommands.map((cmd) => {
              const isCopied = copiedKey === cmd.key;
              return (
                <div
                  key={cmd.key}
                  className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 font-mono text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#21262d] text-slate-400 text-xs">
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      Passo {cmd.stepIndex} • {cmd.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(cmd.command, cmd.key)}
                        className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 transition-colors"
                        title="Copiar comando"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onExecuteCommand && onExecuteCommand(cmd.command)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
                        title="Injetar e executar no terminal ativo"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Injetar</span>
                      </button>
                    </div>
                  </div>
                  <pre className="text-slate-200 overflow-x-auto select-text leading-relaxed whitespace-pre-wrap">
                    {cmd.command}
                  </pre>
                </div>
              );
            })
          )
        ) : activeFilter === 'files' ? (
          /* View Apenas Arquivos e Diffs */
          allFiles.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              Nenhum arquivo modificado ou inspecionado nesta sessão.
            </div>
          ) : (
            allFiles.map((f) => {
              const targetDiff = f.args.Target || f.args.target || null;
              const replaceDiff = f.args.Replacement || f.args.replacement || null;

              return (
                <div
                  key={f.key}
                  className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 font-mono text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#21262d] text-slate-400 text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 truncate">
                      <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{f.path.split('/').pop()}</span>
                    </span>
                    <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-[#21262d] text-slate-300 border border-[#30363d] whitespace-nowrap">
                      {f.name}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono break-all mb-2">
                    {f.path}
                  </div>

                  {targetDiff && replaceDiff !== null && (
                    <div className="space-y-1.5 text-xs mt-2">
                      <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 overflow-x-auto">
                        <span className="text-xs font-bold text-rose-400 block mb-0.5">- Alvo Removido:</span>
                        <pre className="whitespace-pre-wrap">{targetDiff}</pre>
                      </div>
                      <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 overflow-x-auto">
                        <span className="text-xs font-bold text-emerald-400 block mb-0.5">+ Substituição Inserida:</span>
                        <pre className="whitespace-pre-wrap">{replaceDiff || '(conteúdo vazio/deletado)'}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : activeFilter === 'spec' ? (
          /* View Especificação Técnica (Spec) */
          specLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs font-semibold gap-2">
              <RotateCcw className="w-5 h-5 animate-spin text-amber-400" />
              <span>Sintetizando especificação técnica da sessão...</span>
            </div>
          ) : !specRoadmap?.spec ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              Nenhuma especificação disponível para esta conversa.
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Export Markdown Bar */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/25 border border-purple-500/30 text-xs text-purple-200 shadow-xs">
                <div className="flex items-center gap-2 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">
                    {exportSpecSuccess ? 'Exportado para SPEC.md & ROADMAP.md!' : 'Documentação técnica do projeto'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportSpecRoadmap}
                  disabled={exportingSpec}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold transition-all active:scale-95 whitespace-nowrap shrink-0 shadow-xs disabled:opacity-50"
                  title="Gerar SPEC.md e ROADMAP.md na pasta do projeto com 1 clique"
                >
                  {exportSpecSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Exportado</span>
                    </>
                  ) : (
                    <>
                      <Download className={`w-3.5 h-3.5 text-purple-400 ${exportingSpec ? 'animate-bounce' : ''}`} />
                      <span>{exportingSpec ? 'Exportando...' : 'Exportar MD'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Header Card: Escopo & Objetivo */}
              <div className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#21262d]">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Objetivo Central & Escopo
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-amber-200 mb-1.5 leading-snug">
                  {specRoadmap.title || 'Sessão Antigravity'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {specRoadmap.spec.objective}
                </p>

                {/* Tech Stack */}
                <div className="mt-3 pt-2 border-t border-[#21262d]">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-1.5">
                    Stack & Tecnologias Detectadas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {specRoadmap.spec.techStack?.map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 whitespace-nowrap"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Functional Requirements */}
              <div className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] shadow-xs">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#21262d]">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Requisitos Identificados ({specRoadmap.spec.functionalRequirements?.length || 0})
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {specRoadmap.spec.functionalRequirements?.map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-xl bg-[#161b22] border border-[#30363d] text-xs flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-200 block leading-snug">
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

              {/* Architectural Decisions */}
              <div className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#21262d]">
                  <Target className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Decisões de Arquitetura & Engenharia
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {specRoadmap.spec.architecturalDecisions?.map((dec, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                      <span>{dec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Affected Files */}
              <div className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#21262d]">
                  <FileCode2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Arquivos Afetados ({specRoadmap.spec.affectedFiles?.length || 0})
                  </span>
                </div>
                <div className="space-y-1">
                  {specRoadmap.spec.affectedFiles?.map((f, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#161b22] text-xs font-mono text-slate-300 truncate flex items-center justify-between"
                    >
                      <span className="truncate">{f.path.replace('/home/nader', '~')}</span>
                      <span className="text-xs text-purple-300 font-semibold shrink-0 ml-2 whitespace-nowrap">modificado</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : activeFilter === 'roadmap' ? (
          /* View Roadmap & Milestones */
          specLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs font-semibold gap-2">
              <RotateCcw className="w-5 h-5 animate-spin text-blue-400" />
              <span>Calculando roadmap e fases da evolução...</span>
            </div>
          ) : !specRoadmap?.roadmap ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              Nenhum roadmap gerado para esta conversa.
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Overall Progress Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-[#161b22] border border-blue-500/30 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Milestone className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Progresso Geral da Sessão
                    </span>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-blue-300">
                    {specRoadmap.overallProgress}% Concluído
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-[#21262d] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${specRoadmap.overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Export Markdown Bar */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-950/25 border border-blue-500/30 text-xs text-blue-200 shadow-xs">
                <div className="flex items-center gap-2 truncate">
                  <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">
                    {exportSpecSuccess ? 'Exportado para SPEC.md & ROADMAP.md!' : 'Exportar roadmap para o projeto'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportSpecRoadmap}
                  disabled={exportingSpec}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/60 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-bold transition-all active:scale-95 whitespace-nowrap shrink-0 shadow-xs disabled:opacity-50"
                  title="Gerar SPEC.md e ROADMAP.md na pasta do projeto com 1 clique"
                >
                  {exportSpecSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Exportado</span>
                    </>
                  ) : (
                    <>
                      <Download className={`w-3.5 h-3.5 text-blue-400 ${exportingSpec ? 'animate-bounce' : ''}`} />
                      <span>{exportingSpec ? 'Exportando...' : 'Exportar MD'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Milestones List */}
              <div className="space-y-3">
                {specRoadmap.roadmap.milestones?.map((m) => {
                  const isDone = m.status === 'completed' || m.progress === 100;
                  const inProgress = m.status === 'in_progress';

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-[#21262d]">
                        <div>
                          <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : inProgress ? (
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                            ) : (
                              <Milestone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )}
                            <span>{m.title}</span>
                          </h5>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-sans">
                            {m.description}
                          </p>
                        </div>

                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md uppercase font-mono shrink-0 whitespace-nowrap ${
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

                      {/* Tasks Checkbox List */}
                      <div className="space-y-1.5">
                        {m.tasks.map((task, taskIdx) => (
                          <div
                            key={taskIdx}
                            onClick={() => handleToggleTask(m.id, taskIdx)}
                            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#161b22] cursor-pointer transition-colors text-xs select-none"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(task.completed)}
                              onChange={() => {}}
                              className="rounded border-[#30363d] text-purple-600 focus:ring-0 focus:ring-offset-0 bg-[#0d1117] cursor-pointer w-4 h-4"
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
              {specRoadmap.roadmap.nextActions?.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] shadow-xs">
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#21262d]">
                    <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Próximos Passos Recomendados
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {specRoadmap.roadmap.nextActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        ) : (
          /* View Completa Timeline */
          transcript.map((step, idx) => {
            const isUser = step.type === 'USER_INPUT' || step.source === 'USER_EXPLICIT';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed transition-all ${
                  isUser
                    ? 'bg-[#1c2128]/90 border-blue-500/30 text-blue-100'
                    : 'bg-[#161b22] border-[#30363d] text-slate-200'
                }`}
              >
                {/* Step Header */}
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#30363d]/50">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-md whitespace-nowrap ${
                        isUser
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {isUser ? 'Usuário' : 'Antigravity'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Passo {step.stepIndex}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {formatDate(step.createdAt)}
                  </span>
                </div>

                {/* Thinking Disclosure */}
                {step.thinking && (
                  <details className="mb-2 text-xs text-purple-300/90 bg-purple-950/20 border border-purple-500/20 rounded-xl p-2 cursor-pointer group">
                    <summary className="font-semibold select-none list-none flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        Raciocínio Interno da IA
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90 text-purple-400" />
                    </summary>
                    <p className="mt-2 text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed select-text">
                      {step.thinking}
                    </p>
                  </details>
                )}

                {/* Step Text Content */}
                {step.content && (
                  <div className="whitespace-pre-wrap text-slate-200 font-sans leading-relaxed text-xs">
                    {step.content}
                  </div>
                )}

                {/* Tool Calls */}
                {step.toolCalls && step.toolCalls.map((tc, tcIdx) => {
                  const cmdLine = extractCommandLine(tc);
                  const filePath = extractFilePath(tc);
                  const copyKey = `step-${idx}-${tcIdx}`;
                  const isCopied = copiedKey === copyKey;

                  return (
                    <div
                      key={tcIdx}
                      className="mt-2.5 p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] font-mono text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-400 mb-1.5 pb-1 border-b border-[#21262d]">
                        <span className="text-amber-400 font-bold flex items-center gap-1 truncate">
                          <Terminal className="w-3.5 h-3.5 shrink-0" />
                          {tc.name}
                        </span>

                        {cmdLine && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopy(cmdLine, copyKey)}
                              className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300"
                              title="Copiar"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => onExecuteCommand && onExecuteCommand(cmdLine)}
                              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold active:scale-95 whitespace-nowrap"
                              title="Executar no terminal focado"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Executar</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {cmdLine ? (
                        <pre className="text-slate-200 select-text leading-relaxed whitespace-pre-wrap">
                          {cmdLine}
                        </pre>
                      ) : filePath ? (
                        <div className="text-emerald-300 text-xs truncate">
                          📄 {filePath}
                        </div>
                      ) : (
                        <pre className="text-slate-400 select-text leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto">
                          {JSON.stringify(tc.args || tc.arguments || tc, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
          <div ref={messagesEndRef} className="h-px shrink-0" />
        </div>

        {/* Botão simples na parte inferior à direita com setinha para baixo */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-3 right-4 z-30 w-8 h-8 rounded-full bg-[#21262d]/95 hover:bg-purple-600 border border-[#30363d] hover:border-purple-400 text-slate-300 hover:text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90 cursor-pointer animate-fade-in group"
            title="Ir para o final do chat"
          >
            <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5 text-slate-200 group-hover:text-white" />
          </button>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="px-3.5 py-2.5 border-t border-[#30363d] bg-[#1c2128]/90 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sidecar Conectado</span>
        </div>

        {selectedConv && (
          <button
            type="button"
            onClick={() => {
              if (onResumeConversation) {
                onResumeConversation(
                  selectedConv.conversation_id,
                  selectedConv.title || 'Conversa IA',
                  selectedConv.workspace || '/home/nader',
                  isFluid
                );
              }
            }}
            className="flex items-center gap-1 text-xs font-bold text-purple-300 hover:text-white transition-colors"
          >
            <span>Continuar Sessão</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
