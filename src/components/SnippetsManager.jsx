import React, { useState, useEffect, useMemo } from 'react';
import { fetchSnippets, createSnippet, deleteSnippet } from '../services/api';
import { 
  Code2, 
  Play, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Search, 
  Sliders, 
  Tag, 
  X, 
  Terminal,
  Sparkles
} from 'lucide-react';

function extractPlaceholders(cmd) {
  if (!cmd) return [];
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = [];
  const seen = new Set();
  let match;
  while ((match = regex.exec(cmd)) !== null) {
    const raw = match[1];
    const [name, defaultVal] = raw.split(':');
    const cleanName = name.trim();
    if (!seen.has(cleanName)) {
      seen.add(cleanName);
      matches.push({
        name: cleanName,
        defaultValue: defaultVal !== undefined ? defaultVal.trim() : ''
      });
    }
  }
  return matches;
}

function resolveCommand(cmd, values) {
  let resolved = cmd;
  Object.entries(values).forEach(([name, val]) => {
    const pattern = new RegExp(`\\{\\{${name}(?::[^}]*)?\\}\\}`, 'g');
    resolved = resolved.replace(pattern, val || '');
  });
  return resolved;
}

export default function SnippetsManager({ onExecuteSnippet }) {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modal de Parâmetros
  const [paramModal, setParamModal] = useState(null); // { snippet, placeholders, values }

  const [form, setForm] = useState({
    title: '',
    command: '',
    category: 'Geral'
  });

  useEffect(() => {
    loadSnippets();
  }, []);

  const loadSnippets = async () => {
    try {
      const data = await fetchSnippets();
      setSnippets(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createSnippet(form);
      setShowAddModal(false);
      setForm({ title: '', command: '', category: 'Geral' });
      loadSnippets();
    } catch (e) {
      alert('Erro ao salvar snippet: ' + e.message);
    }
  };

  const handleQuickAddPreset = async (preset) => {
    try {
      await createSnippet(preset);
      loadSnippets();
    } catch (e) {
      alert('Erro ao adicionar preset: ' + e.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir este snippet?')) return;
    try {
      await deleteSnippet(id);
      loadSnippets();
    } catch (e) {
      alert('Erro ao excluir snippet: ' + e.message);
    }
  };

  const handleCopy = (cmd, id) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Execução inteligente: se tiver variáveis {{...}}, abre modal de parâmetros
  const handleTriggerExecute = (snip) => {
    const placeholders = extractPlaceholders(snip.command);
    if (placeholders.length > 0) {
      const initialValues = {};
      placeholders.forEach((p) => {
        initialValues[p.name] = p.defaultValue;
      });
      setParamModal({
        snippet: snip,
        placeholders,
        values: initialValues
      });
    } else {
      onExecuteSnippet(snip.command);
    }
  };

  const handleRunParametric = () => {
    if (!paramModal) return;
    const finalCmd = resolveCommand(paramModal.snippet.command, paramModal.values);
    onExecuteSnippet(finalCmd);
    setParamModal(null);
  };

  // Categorias únicas
  const categories = useMemo(() => {
    const set = new Set();
    snippets.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [snippets]);

  // Snippets filtrados
  const filteredSnippets = useMemo(() => {
    return snippets.filter((s) => {
      const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
      const query = searchFilter.toLowerCase().trim();
      const matchQuery = !query || 
        s.title.toLowerCase().includes(query) || 
        s.command.toLowerCase().includes(query) || 
        (s.category && s.category.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });
  }, [snippets, selectedCategory, searchFilter]);

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-slate-100">
      {/* Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-[#30363d] flex items-center justify-between shrink-0 bg-[#161b22]/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 
              className="text-sm sm:text-base font-bold text-white leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Snippets de Terminal
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Comandos parametrizáveis (com variáveis {'{{var}}'}) e execução em 1 clique
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="min-h-[38px] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="whitespace-nowrap">Novo Snippet</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#30363d]/60 bg-[#161b22]/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar por título, comando ou categoria..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-9 pr-8 py-1.5 text-base sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40'
                : 'bg-[#21262d] text-slate-400 hover:text-white border border-[#30363d]'
            }`}
          >
            Todas ({snippets.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#21262d] text-slate-400 hover:text-white border border-[#30363d]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Snippet Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs font-medium">
            Carregando snippets...
          </div>
        ) : filteredSnippets.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 text-center max-w-2xl mx-auto my-6 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-2">
              {snippets.length === 0 ? 'Sua Biblioteca de Snippets está Vazia' : 'Nenhum Snippet Encontrado'}
            </h3>
            <p className="text-xs text-slate-300 mb-6 max-w-md mx-auto leading-relaxed">
              {snippets.length === 0 
                ? 'Salve comandos frequentes do shell com variáveis interativas {{var}} para disparar nos seus terminais com 1 clique. Adicione um modelo pré-configurado abaixo:'
                : 'Nenhum snippet corresponde ao filtro atual. Tente buscar por outros termos ou limpe o filtro.'}
            </p>
            {snippets.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <button
                  type="button"
                  onClick={() => handleQuickAddPreset({
                    title: 'Derrubar Processo na Porta TCP',
                    command: 'fuser -k {{porta:3000}}/tcp',
                    category: 'Rede'
                  })}
                  className="p-3.5 rounded-xl bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-emerald-500/40 text-left transition-all active:scale-95 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-emerald-400">
                    <Sliders className="w-4 h-4" />
                    <span>Kill Port</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono truncate">fuser -k {'{{porta}}'}/tcp</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAddPreset({
                    title: 'Logs de Container Docker',
                    command: 'docker logs -f --tail={{linhas:100}} {{container}}',
                    category: 'Docker'
                  })}
                  className="p-3.5 rounded-xl bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-blue-500/40 text-left transition-all active:scale-95 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-blue-400">
                    <Sliders className="w-4 h-4" />
                    <span>Docker Logs</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono truncate">docker logs -f {'{{container}}'}</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAddPreset({
                    title: 'Git Commit com Mensagem',
                    command: 'git commit -m "{{mensagem:chore: update}}"',
                    category: 'Git'
                  })}
                  className="p-3.5 rounded-xl bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-purple-500/40 text-left transition-all active:scale-95 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-purple-400">
                    <Sliders className="w-4 h-4" />
                    <span>Git Commit</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono truncate">git commit -m ...</div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSnippets.map((snip) => {
              const placeholders = extractPlaceholders(snip.command);
              const hasParams = placeholders.length > 0;
              return (
                <div 
                  key={snip.id}
                  className="bg-[#161b22] border border-[#30363d] hover:border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 
                        className="text-xs sm:text-sm font-bold text-white truncate pr-2"
                        style={{ textWrap: 'balance' }}
                      >
                        {snip.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasParams && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                            <Sliders className="w-3 h-3" />
                            <span>{placeholders.length} var</span>
                          </span>
                        )}
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#21262d] text-slate-300 border border-[#30363d] whitespace-nowrap">
                          {snip.category}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(snip.id, e)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                          title="Remover snippet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#0d1117] p-3 rounded-xl border border-[#21262d] font-mono text-xs text-emerald-400 overflow-x-auto select-text mb-4 leading-relaxed">
                      {snip.command}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#30363d]/60">
                    <button
                      type="button"
                      onClick={() => handleCopy(snip.command, snip.id)}
                      className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-200 text-xs font-semibold transition-colors active:scale-95 cursor-pointer"
                    >
                      {copiedId === snip.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span className="whitespace-nowrap">{copiedId === snip.id ? 'Copiado!' : 'Copiar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTriggerExecute(snip)}
                      className={`min-h-[38px] flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
                        hasParams
                          ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                      }`}
                    >
                      {hasParams ? (
                        <>
                          <Sliders className="w-4 h-4" />
                          <span className="whitespace-nowrap">Configurar & Executar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span className="whitespace-nowrap">Executar no Terminal</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Parâmetros Interativos */}
      {paramModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg p-6 shadow-2xl safe-area-bottom">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#30363d]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                    {paramModal.snippet.title}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Preencha os parâmetros para compor o comando</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setParamModal(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#21262d] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Campos de Parâmetros */}
            <div className="space-y-3.5 mb-5 max-h-60 overflow-y-auto pr-1">
              {paramModal.placeholders.map((p) => (
                <div key={p.name}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    {p.name}
                  </label>
                  <input
                    type="text"
                    value={paramModal.values[p.name] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setParamModal((prev) => ({
                        ...prev,
                        values: {
                          ...prev.values,
                          [p.name]: val
                        }
                      }));
                    }}
                    placeholder={`Valor para ${p.name}`}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  />
                </div>
              ))}
            </div>

            {/* Live Preview do Comando Resolvido */}
            <div className="mb-5">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Comando Resolvido (Pré-visualização):
              </span>
              <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] font-mono text-xs text-cyan-300 overflow-x-auto select-all leading-relaxed">
                {resolveCommand(paramModal.snippet.command, paramModal.values)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#30363d]">
              <button
                type="button"
                onClick={() => {
                  const cmd = resolveCommand(paramModal.snippet.command, paramModal.values);
                  handleCopy(cmd, 'param-copy');
                }}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Copiar
              </button>

              <button
                type="button"
                onClick={() => setParamModal(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleRunParametric}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Executar no Terminal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal New Snippet */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 shadow-2xl safe-area-bottom">
            <h2 className="text-sm sm:text-base font-bold text-white mb-4">Adicionar Novo Snippet</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Título do Snippet
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Verificar portas abertas"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Categoria
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex: Git, Docker, Sistema"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Comando Bash
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.command}
                  onChange={(e) => setForm({ ...form, command: e.target.value })}
                  placeholder="Ex: docker logs -f --tail={{linhas:100}} {{container}}"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 font-mono text-emerald-400 text-base sm:text-xs focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  💡 <strong>Variáveis dinâmicas:</strong> use <code className="text-cyan-300 font-mono font-bold bg-[#0d1117] px-1 py-0.5 rounded border border-[#30363d]">{`{{variavel}}`}</code> ou <code className="text-cyan-300 font-mono font-bold bg-[#0d1117] px-1 py-0.5 rounded border border-[#30363d]">{`{{porta:8080}}`}</code> com valor padrão.
                </p>
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
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                >
                  Salvar Snippet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
