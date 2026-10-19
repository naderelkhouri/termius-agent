import React, { useState, useEffect } from 'react';
import { fetchSnippets, createSnippet, deleteSnippet } from '../services/api';
import { Code2, Play, Plus, Copy, Check, Trash2 } from 'lucide-react';

export default function SnippetsManager({ onExecuteSnippet }) {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
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
              Comandos pré-formatados e automações rápidas com 1 clique
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="min-h-[38px] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="whitespace-nowrap">Novo Snippet</span>
        </button>
      </div>

      {/* Snippet Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs font-medium">
            Carregando snippets...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snippets.map((snip) => (
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
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#21262d] text-slate-300 border border-[#30363d] whitespace-nowrap">
                        {snip.category}
                      </span>
                      <button
                        onClick={(e) => handleDelete(snip.id, e)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
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
                    onClick={() => handleCopy(snip.command, snip.id)}
                    className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-200 text-xs font-semibold transition-colors active:scale-95"
                  >
                    {copiedId === snip.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span className="whitespace-nowrap">{copiedId === snip.id ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={() => onExecuteSnippet(snip.command)}
                    className="min-h-[38px] flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Play className="w-4 h-4" />
                    <span className="whitespace-nowrap">Executar no Terminal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  placeholder="Ex: ss -tulpn"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 font-mono text-emerald-400 text-base sm:text-xs focus:outline-none focus:border-emerald-500"
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
