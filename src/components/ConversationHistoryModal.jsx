import React, { useState, useEffect } from 'react';
import { 
  fetchConversations, 
  fetchTranscript 
} from '../services/api';
import { 
  BotMessageSquare, 
  Search, 
  Calendar, 
  Terminal, 
  Copy, 
  Check, 
  ArrowLeft, 
  Play,
  Zap,
  Folder
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

export default function ConversationHistoryModal({ 
  onExecuteCommand, 
  onOpenProjectTerminal, 
  onResumeConversation 
}) {
  const [conversations, setConversations] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const detectedCwd = React.useMemo(() => {
    if (!transcript) return '/home/nader';
    for (const step of transcript) {
      if (step.toolCalls) {
        for (const tc of step.toolCalls) {
          const args = tc.args || tc.arguments || {};
          let rawCwd = args.Cwd || args.cwd;
          if (rawCwd && typeof rawCwd === 'string') {
            const clean = rawCwd.replace(/^["']|["']$/g, '').trim();
            if (clean.startsWith('/')) return clean;
          }
        }
      }
    }
    return '/home/nader';
  }, [transcript]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadConversations = async (searchTerm = search) => {
    setLoading(true);
    try {
      const data = await fetchConversations({ search: searchTerm, limit: 100 });
      setConversations(data.conversations || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conv) => {
    setSelectedConversation(conv);
    setTranscriptLoading(true);
    try {
      const data = await fetchTranscript(conv.conversation_id);
      setTranscript(data.steps || []);
    } catch (e) {
      console.error(e);
      setTranscript([]);
    } finally {
      setTranscriptLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-slate-100">
      {/* Top Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-[#30363d] flex items-center justify-between shrink-0 bg-[#161b22]/80 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {selectedConversation && (
            <button
              onClick={() => {
                setSelectedConversation(null);
                setTranscript(null);
              }}
              className="w-9 h-9 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-200 flex items-center justify-center shrink-0 transition-colors active:scale-95"
              title="Voltar para a lista"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
            <BotMessageSquare className="w-5 h-5 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h1 
              className="text-sm sm:text-base font-bold text-white leading-tight truncate"
              style={{ textWrap: 'balance' }}
            >
              {selectedConversation ? selectedConversation.title || 'Conversa Antigravity' : 'Histórico de Conversas da IA'}
            </h1>
            <p className="text-xs text-slate-300 font-medium truncate">
              {selectedConversation 
                ? `ID: ${selectedConversation.conversation_id.slice(0, 8)} • ${transcript?.length || selectedConversation.step_count} interações` 
                : `${total} sessões registradas no cérebro do Antigravity CLI`}
            </p>
          </div>
        </div>

        {selectedConversation ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (onResumeConversation) {
                  onResumeConversation(
                    selectedConversation.conversation_id,
                    selectedConversation.title || 'Conversa IA',
                    detectedCwd || selectedConversation.workspace || '/home/nader'
                  );
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
              title="Continuar esta conversa interativamente no terminal (agy --conversation)"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-pulse" />
              <span>Continuar Sessão no Terminal</span>
            </button>

            <button
              onClick={() => onOpenProjectTerminal && onOpenProjectTerminal(detectedCwd, selectedConversation.title || 'Projeto IA')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0"
              title={`Abrir terminal limpo nesta pasta (${detectedCwd})`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal na Pasta</span>
            </button>
          </div>
        ) : (
          <div className="relative w-48 sm:w-80 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar histórico..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-9 pr-3.5 py-2 text-base sm:text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {!selectedConversation ? (
          /* List View */
          loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-xs font-semibold">
              Carregando histórico do SQLite...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {conversations.map((c) => (
                <div
                  key={c.conversation_id}
                  onClick={() => handleSelectConversation(c)}
                  className="group bg-[#161b22] hover:bg-[#1c2128] border border-[#30363d] hover:border-purple-500/40 rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2.5 mb-2">
                      <h2 
                        className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-purple-300 transition-colors line-clamp-1"
                        style={{ textWrap: 'balance' }}
                      >
                        {c.title || c.preview || 'Sem título'}
                      </h2>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#21262d] text-slate-300 border border-[#30363d] font-mono shrink-0 whitespace-nowrap">
                        {c.step_count} steps
                      </span>
                    </div>

                    {c.workspace && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2.5 truncate font-mono">
                        <Folder className="w-3.5 h-3.5 text-purple-400/80 shrink-0" />
                        <span className="truncate">{c.workspace.replace('/home/nader', '~')}</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3 font-normal">
                      {c.preview || 'Sem preview disponível.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#30363d]/60 flex items-center justify-between text-xs text-slate-400 gap-2">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{formatDate(c.last_modified_time)}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onResumeConversation) {
                            onResumeConversation(c.conversation_id, c.title || 'Conversa IA', c.workspace || '/home/nader');
                          }
                        }}
                        className="min-h-[28px] flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold transition-all active:scale-95 shadow-xs"
                        title="Continuar esta conversa com 1 clique (agy --conversation)"
                      >
                        <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span>Continuar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Transcript Detail View */
          transcriptLoading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-xs font-semibold">
              Carregando timeline da conversa...
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {transcript && transcript.length > 0 ? (
                transcript.map((step, idx) => {
                  const isUser = step.type === 'USER_INPUT' || step.source === 'USER_EXPLICIT';
                  return (
                    <div 
                      key={idx}
                      className={`p-4 sm:p-5 rounded-2xl border ${
                        isUser 
                          ? 'bg-[#1c2128]/90 border-blue-500/30' 
                          : 'bg-[#161b22] border-[#30363d]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-md whitespace-nowrap ${
                            isUser 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            {isUser ? 'Usuário' : 'Antigravity AI'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                            Passo {step.stepIndex} • {formatDate(step.createdAt)}
                          </span>
                        </div>

                        {step.toolCalls && step.toolCalls.length > 0 && (
                          <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 whitespace-nowrap">
                            {step.toolCalls.length} chamada(s) de ferramenta
                          </span>
                        )}
                      </div>

                      {/* Message Content */}
                      {step.content && (
                        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                          {step.content}
                        </div>
                      )}

                      {/* Tool Calls & Commands */}
                      {step.toolCalls && step.toolCalls.map((tc, tcIdx) => {
                        const cmdLine = extractCommandLine(tc);
                        const isCmd = Boolean(cmdLine) || tc.name === 'run_command' || tc.name === 'bash';
                        const copyKey = `${idx}-${tcIdx}`;
                        const isCopied = copiedIndex === copyKey;

                        return (
                          <div 
                            key={tcIdx}
                            className="mt-3.5 p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] font-mono text-xs"
                          >
                            <div className="flex items-center justify-between text-slate-300 mb-2 pb-1.5 border-b border-[#21262d] flex-wrap gap-2">
                              <span className="text-amber-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
                                <Terminal className="w-4 h-4" />
                                Ferramenta: {tc.name}
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {cmdLine && (
                                  <button
                                    onClick={() => handleCopy(cmdLine, copyKey)}
                                    className="min-h-[30px] flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap active:scale-95"
                                    title="Copiar comando"
                                  >
                                    {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                                  </button>
                                )}

                                {cmdLine && (
                                  <button
                                    onClick={() => {
                                      if (onExecuteCommand) {
                                        onExecuteCommand(cmdLine);
                                      }
                                    }}
                                    className="min-h-[30px] flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 px-3 py-1 rounded-lg transition-all whitespace-nowrap active:scale-95 shadow-xs"
                                    title="Mudar para o terminal e executar o comando imediatamente"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    Executar no Terminal
                                  </button>
                                )}
                              </div>
                            </div>
                            <pre className="text-slate-200 overflow-x-auto select-text leading-relaxed whitespace-pre-wrap">
                              {cmdLine || JSON.stringify(tc.args || tc.arguments || tc, null, 2)}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 text-slate-400 text-xs font-semibold">
                  Nenhum evento detalhado encontrado no transcript.
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
