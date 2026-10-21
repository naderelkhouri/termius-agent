import React, { useState, useEffect, useMemo } from 'react';
import { 
  fetchConversations, 
  fetchTranscript,
  fetchFavorites,
  addFavorite,
  removeFavorite,
  fetchFluidConversations,
  addFluidConversation,
  removeFluidConversation
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
  Folder,
  Star,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Milestone
} from 'lucide-react';
import SpecRoadmapModal from './SpecRoadmapModal';

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
  const [specModalConv, setSpecModalConv] = useState(null);

  // Favoritos
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem('termius_favorite_conversations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modo Fluido por Conversa
  const [fluidConversations, setFluidConversations] = useState(() => {
    try {
      const stored = localStorage.getItem('termius_fluid_conversations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modo de visualização: 'grid' (blocos) ou 'table' (lista em tabela)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('termius_conv_view_mode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  // Filtro de apenas favoritos
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);

  // Ordenação
  const [sortField, setSortField] = useState('last_modified_time'); // 'favorite' | 'fluid' | 'title' | 'workspace' | 'step_count' | 'last_modified_time'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  const detectedCwd = useMemo(() => {
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

  // Carrega favoritos e modo fluido do backend na montagem
  useEffect(() => {
    fetchFavorites().then((favs) => {
      if (Array.isArray(favs) && favs.length > 0) {
        setFavorites((prev) => {
          const merged = Array.from(new Set([...prev, ...favs]));
          try {
            localStorage.setItem('termius_favorite_conversations', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(() => {});

    fetchFluidConversations().then((fluids) => {
      if (Array.isArray(fluids) && fluids.length > 0) {
        setFluidConversations((prev) => {
          const merged = Array.from(new Set([...prev, ...fluids]));
          try {
            localStorage.setItem('termius_fluid_conversations', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(() => {});
  }, []);

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

  const toggleFavorite = async (convId, e) => {
    if (e) e.stopPropagation();
    const isFav = favorites.includes(convId);
    const nextFavs = isFav 
      ? favorites.filter((id) => id !== convId) 
      : [...favorites, convId];
    
    setFavorites(nextFavs);
    try {
      localStorage.setItem('termius_favorite_conversations', JSON.stringify(nextFavs));
    } catch {}

    try {
      if (isFav) {
        await removeFavorite(convId);
      } else {
        await addFavorite(convId);
      }
    } catch (err) {
      console.warn('Falha ao sincronizar favorito com backend:', err);
    }
  };

  const toggleFluid = async (convId, e) => {
    if (e) e.stopPropagation();
    const isFluid = fluidConversations.includes(convId);
    const nextFluids = isFluid
      ? fluidConversations.filter((id) => id !== convId)
      : [...fluidConversations, convId];

    setFluidConversations(nextFluids);
    try {
      localStorage.setItem('termius_fluid_conversations', JSON.stringify(nextFluids));
    } catch {}

    try {
      if (isFluid) {
        await removeFluidConversation(convId);
      } else {
        await addFluidConversation(convId);
      }
    } catch (err) {
      console.warn('Falha ao sincronizar modo fluido com backend:', err);
    }
  };

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('termius_conv_view_mode', mode);
    } catch {}
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'title' || field === 'workspace' ? 'asc' : 'desc');
    }
  };

  const sortedAndFilteredConversations = useMemo(() => {
    let list = [...conversations];
    if (filterFavoritesOnly) {
      list = list.filter((c) => favorites.includes(c.conversation_id));
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'favorite') {
        const aFav = favorites.includes(a.conversation_id) ? 1 : 0;
        const bFav = favorites.includes(b.conversation_id) ? 1 : 0;
        cmp = aFav - bFav;
      } else if (sortField === 'fluid') {
        const aFluid = fluidConversations.includes(a.conversation_id) ? 1 : 0;
        const bFluid = fluidConversations.includes(b.conversation_id) ? 1 : 0;
        cmp = aFluid - bFluid;
      } else if (sortField === 'step_count') {
        cmp = (a.step_count || 0) - (b.step_count || 0);
      } else if (sortField === 'title') {
        const aTitle = (a.title || a.preview || '').toLowerCase();
        const bTitle = (b.title || b.preview || '').toLowerCase();
        cmp = aTitle.localeCompare(bTitle);
      } else if (sortField === 'workspace') {
        const aWs = (a.workspace || '').toLowerCase();
        const bWs = (b.workspace || '').toLowerCase();
        cmp = aWs.localeCompare(bWs);
      } else {
        // last_modified_time
        const aTime = a.last_modified_time ? new Date(a.last_modified_time).getTime() : 0;
        const bTime = b.last_modified_time ? new Date(b.last_modified_time).getTime() : 0;
        cmp = aTime - bTime;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [conversations, favorites, fluidConversations, filterFavoritesOnly, sortField, sortDirection]);

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
                : `${sortedAndFilteredConversations.length} de ${total} sessões encontradas`}
            </p>
          </div>
        </div>

        {selectedConversation ? (
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Toggle Modo Fluido para esta conversa específica */}
            <button
              type="button"
              onClick={() => setSpecModalConv(selectedConversation)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-200 border border-amber-500/35 text-xs font-bold transition-all shrink-0"
              title="Visualizar a Spec técnica e o Roadmap desta conversa"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Spec & Roadmap</span>
            </button>

            <button
              type="button"
              onClick={() => toggleFluid(selectedConversation.conversation_id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                fluidConversations.includes(selectedConversation.conversation_id)
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/10'
                  : 'bg-[#21262d] text-slate-300 border-[#30363d] hover:text-white'
              }`}
              title="Modo Fluido: auto-aprova comandos 'Run this command? 1. Yes, run command' do Antigravity"
            >
              <Zap className={`w-3.5 h-3.5 ${fluidConversations.includes(selectedConversation.conversation_id) ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Modo Fluido: {fluidConversations.includes(selectedConversation.conversation_id) ? 'ATIVO' : 'OFF'}</span>
            </button>

            <button
              onClick={() => {
                if (onResumeConversation) {
                  const isFluid = fluidConversations.includes(selectedConversation.conversation_id);
                  onResumeConversation(
                    selectedConversation.conversation_id,
                    selectedConversation.title || 'Conversa IA',
                    detectedCwd || selectedConversation.workspace || '/home/nader',
                    isFluid
                  );
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap ${
                fluidConversations.includes(selectedConversation.conversation_id)
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
                  : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20'
              }`}
              title={
                fluidConversations.includes(selectedConversation.conversation_id)
                  ? "Continuar no Modo Fluido (auto-aprovação de comandos sem confirmações manuais)"
                  : "Continuar esta conversa interativamente no terminal (agy --conversation)"
              }
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-pulse" />
              <span>
                {fluidConversations.includes(selectedConversation.conversation_id)
                  ? '⚡ Continuar Sessão (Fluido)'
                  : 'Continuar Sessão no Terminal'}
              </span>
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
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Search Box */}
            <div className="relative w-36 sm:w-60 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar histórico..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Filter by Favorites */}
            <button
              onClick={() => setFilterFavoritesOnly((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 shrink-0 ${
                filterFavoritesOnly
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-xs'
                  : 'bg-[#21262d] text-slate-300 border-[#30363d] hover:bg-[#30363d] hover:text-white'
              }`}
              title={filterFavoritesOnly ? "Mostrar todas as conversas" : "Filtrar apenas favoritas"}
            >
              <Star className={`w-3.5 h-3.5 ${filterFavoritesOnly ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Favoritas</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#161b22] border border-[#30363d]">
                {favorites.length}
              </span>
            </button>

            {/* View Mode Switcher: Grid vs Table */}
            <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-xl p-0.5 shrink-0">
              <button
                onClick={() => handleToggleViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Visualização em Blocos (Grid)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Blocos</span>
              </button>
              <button
                onClick={() => handleToggleViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Visualização em Lista / Tabela"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Tabela</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {!selectedConversation ? (
          loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-xs font-semibold">
              Carregando histórico do SQLite...
            </div>
          ) : sortedAndFilteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs font-semibold">
              <BotMessageSquare className="w-10 h-10 text-slate-600 mb-3" />
              <p>Nenhuma conversa encontrada {filterFavoritesOnly ? 'nos seus favoritos' : 'com os critérios informados'}.</p>
              {filterFavoritesOnly && (
                <button
                  onClick={() => setFilterFavoritesOnly(false)}
                  className="mt-3 text-purple-400 hover:underline"
                >
                  Ver todas as sessões
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <div className="overflow-x-auto rounded-2xl border border-[#30363d] bg-[#161b22] shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#30363d] bg-[#1c2128]/90 text-slate-300">
                    <th className="py-3 px-3 w-16 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSort('favorite')}
                          className="p-1 hover:bg-[#30363d] rounded-lg transition-colors"
                          title="Ordenar por Favoritos"
                        >
                          <Star className={`w-3.5 h-3.5 mx-auto ${sortField === 'favorite' ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSort('fluid')}
                          className="p-1 hover:bg-[#30363d] rounded-lg transition-colors"
                          title="Ordenar por Modo Fluido"
                        >
                          <Zap className={`w-3.5 h-3.5 mx-auto ${sortField === 'fluid' ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                        </button>
                      </div>
                    </th>
                    <th className="py-3 px-4 font-bold">
                      <button
                        type="button"
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-1.5 hover:text-purple-300 transition-colors select-none"
                      >
                        <span>Título & Conteúdo</span>
                        {sortField === 'title' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-400" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4 font-bold w-48 hidden md:table-cell">
                      <button
                        type="button"
                        onClick={() => handleSort('workspace')}
                        className="flex items-center gap-1.5 hover:text-purple-300 transition-colors select-none"
                      >
                        <span>Workspace</span>
                        {sortField === 'workspace' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-400" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4 font-bold w-24 text-center">
                      <button
                        type="button"
                        onClick={() => handleSort('step_count')}
                        className="flex items-center justify-center gap-1.5 hover:text-purple-300 transition-colors select-none w-full"
                      >
                        <span>Passos</span>
                        {sortField === 'step_count' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-400" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4 font-bold w-44 hidden sm:table-cell">
                      <button
                        type="button"
                        onClick={() => handleSort('last_modified_time')}
                        className="flex items-center gap-1.5 hover:text-purple-300 transition-colors select-none"
                      >
                        <span>Última Modificação</span>
                        {sortField === 'last_modified_time' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-400" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4 font-bold w-44 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]/50">
                  {sortedAndFilteredConversations.map((c) => {
                    const isFav = favorites.includes(c.conversation_id);
                    const isFluid = fluidConversations.includes(c.conversation_id);

                    return (
                      <tr
                        key={c.conversation_id}
                        onClick={() => handleSelectConversation(c)}
                        className="hover:bg-[#1f242c] transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(c.conversation_id, e)}
                              className="p-1 rounded-md hover:bg-[#30363d] transition-colors"
                              title={isFav ? "Remover dos favoritos" : "Marcar como favorito"}
                            >
                              <Star className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                                isFav ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500 hover:text-slate-300'
                              }`} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => toggleFluid(c.conversation_id, e)}
                              className="p-1 rounded-md hover:bg-[#30363d] transition-colors"
                              title={
                                isFluid 
                                  ? "Modo Fluido ATIVADO (auto-aprova comandos 'Run this command?'). Clique para desativar." 
                                  : "Ativar Modo Fluido para esta conversa"
                              }
                            >
                              <Zap className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                                isFluid ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-500 hover:text-amber-300'
                              }`} />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-1 flex items-center gap-1.5">
                            {isFluid && (
                              <span title="Modo Fluido ativo nesta conversa">
                                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                              </span>
                            )}
                            <span>{c.title || c.preview || 'Sem título'}</span>
                          </div>
                          <div className="text-slate-400 text-[11px] line-clamp-1 font-normal mt-0.5">
                            {c.preview || 'Sem preview disponível.'}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          {c.workspace ? (
                            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] truncate max-w-[170px]">
                              <Folder className="w-3.5 h-3.5 text-purple-400/80 shrink-0" />
                              <span className="truncate">{c.workspace.replace('/home/nader', '~')}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#21262d] text-slate-300 border border-[#30363d] font-mono">
                            {c.step_count}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell text-slate-400 text-[11px] whitespace-nowrap font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(c.last_modified_time)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSpecModalConv(c)}
                              className="p-1.5 rounded-lg bg-[#21262d] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-[#30363d] transition-colors"
                              title="Ver Spec & Roadmap da Sessão"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onResumeConversation) {
                                  onResumeConversation(c.conversation_id, c.title || 'Conversa IA', c.workspace || '/home/nader', isFluid);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-xs whitespace-nowrap border ${
                                isFluid
                                  ? 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 hover:text-white border-amber-500/40 shadow-amber-500/10'
                                  : 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border-purple-500/40'
                              }`}
                              title={
                                isFluid
                                  ? "Continuar no Modo Fluido (--dangerously-skip-permissions + auto-aprovação)"
                                  : "Continuar esta conversa com 1 clique (agy --conversation)"
                              }
                            >
                              <Zap className={`w-3 h-3 ${isFluid ? 'text-amber-300 fill-amber-300 animate-pulse' : 'text-yellow-400 fill-yellow-400'}`} />
                              <span>{isFluid ? '⚡ Continuar (Fluido)' : 'Continuar'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Block (Grid) View */
            <div>
              {/* Sort Bar for Grid View */}
              <div className="flex items-center justify-between mb-3.5 px-1 text-xs text-slate-400 flex-wrap gap-2">
                <span className="font-semibold text-slate-300">
                  {sortedAndFilteredConversations.length} conversas exibidas
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]">Ordenar por:</span>
                  <button
                    onClick={() => handleSort('last_modified_time')}
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-all ${
                      sortField === 'last_modified_time'
                        ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                        : 'bg-[#161b22] text-slate-400 border-[#30363d] hover:text-white'
                    }`}
                  >
                    Data {sortField === 'last_modified_time' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => handleSort('title')}
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-all ${
                      sortField === 'title'
                        ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                        : 'bg-[#161b22] text-slate-400 border-[#30363d] hover:text-white'
                    }`}
                  >
                    Título {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => handleSort('step_count')}
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-all ${
                      sortField === 'step_count'
                        ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                        : 'bg-[#161b22] text-slate-400 border-[#30363d] hover:text-white'
                    }`}
                  >
                    Passos {sortField === 'step_count' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => handleSort('fluid')}
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-all ${
                      sortField === 'fluid'
                        ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                        : 'bg-[#161b22] text-slate-400 border-[#30363d] hover:text-white'
                    }`}
                  >
                    ⚡ Fluido {sortField === 'fluid' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {sortedAndFilteredConversations.map((c) => {
                  const isFav = favorites.includes(c.conversation_id);
                  const isFluid = fluidConversations.includes(c.conversation_id);

                  return (
                    <div
                      key={c.conversation_id}
                      onClick={() => handleSelectConversation(c)}
                      className={`group bg-[#161b22] hover:bg-[#1c2128] border ${
                        isFluid
                          ? 'border-amber-500/40 bg-[#161b22]/95 shadow-sm shadow-amber-500/5'
                          : isFav 
                            ? 'border-yellow-500/40 bg-[#161b22]/95 shadow-sm' 
                            : 'border-[#30363d] hover:border-purple-500/40'
                      } rounded-2xl p-4 cursor-pointer transition-all shadow-xs flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2.5 mb-2">
                          <h2 
                            className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-purple-300 transition-colors line-clamp-1 flex-1 pr-1 flex items-center gap-1.5"
                            style={{ textWrap: 'balance' }}
                          >
                            {isFluid && (
                              <span title="Modo Fluido ativo nesta conversa">
                                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                              </span>
                            )}
                            <span>{c.title || c.preview || 'Sem título'}</span>
                          </h2>
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => toggleFluid(c.conversation_id, e)}
                              className="p-1 rounded-md hover:bg-[#30363d] transition-colors"
                              title={
                                isFluid 
                                  ? "Modo Fluido ATIVADO (auto-aprova comandos 'Run this command?'). Clique para desativar." 
                                  : "Ativar Modo Fluido para esta conversa"
                              }
                            >
                              <Zap className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                                isFluid ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-500 hover:text-amber-300'
                              }`} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(c.conversation_id, e)}
                              className="p-1 rounded-md hover:bg-[#30363d] transition-colors"
                              title={isFav ? "Remover dos favoritos" : "Marcar como favorito"}
                            >
                              <Star className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                                isFav ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500 hover:text-slate-300'
                              }`} />
                            </button>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#21262d] text-slate-300 border border-[#30363d] font-mono whitespace-nowrap">
                              {c.step_count} steps
                            </span>
                          </div>
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

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSpecModalConv(c);
                            }}
                            className="min-h-[28px] px-2 py-1 rounded-lg bg-[#21262d] hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 border border-[#30363d] text-xs font-semibold flex items-center gap-1 transition-all"
                            title="Ver Spec & Roadmap da Sessão"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">Spec</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onResumeConversation) {
                                onResumeConversation(c.conversation_id, c.title || 'Conversa IA', c.workspace || '/home/nader', isFluid);
                              }
                            }}
                            className={`min-h-[28px] flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-xs border ${
                              isFluid
                                ? 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 hover:text-white border-amber-500/40 shadow-amber-500/10'
                                : 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border-purple-500/40'
                            }`}
                            title={
                              isFluid
                                ? "Continuar no Modo Fluido (auto-aprovação de confirmações 'Run this command?')"
                                : "Continuar esta conversa com 1 clique (agy --conversation)"
                            }
                          >
                            <Zap className={`w-3 h-3 ${isFluid ? 'text-amber-300 fill-amber-300 animate-pulse' : 'text-yellow-400 fill-yellow-400'}`} />
                            <span>{isFluid ? '⚡ Continuar (Fluido)' : 'Continuar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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

      {/* Modal Spec & Roadmap */}
      <SpecRoadmapModal
        conversationId={specModalConv?.conversation_id}
        conversationTitle={specModalConv?.title}
        isOpen={Boolean(specModalConv)}
        onClose={() => setSpecModalConv(null)}
        onResumeConversation={onResumeConversation}
      />
    </div>
  );
}
