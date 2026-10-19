import React, { useState, useEffect } from 'react';
import { fetchHosts, createHost, deleteHost } from '../services/api';
import { Server, Plus, Trash2, ArrowRight, Folder, Globe, Laptop } from 'lucide-react';

export default function HostsManager({ onConnectHost }) {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    label: '',
    address: '127.0.0.1',
    user: 'nader',
    port: 22,
    type: 'local',
    group: 'Projetos',
    color: '#58a6ff',
    defaultCwd: '/home/nader'
  });

  useEffect(() => {
    loadHosts();
  }, []);

  const loadHosts = async () => {
    try {
      const data = await fetchHosts();
      setHosts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createHost(form);
      setShowAddModal(false);
      loadHosts();
    } catch (e) {
      alert('Erro ao salvar host: ' + e.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir este host?')) return;
    try {
      await deleteHost(id);
      loadHosts();
    } catch (e) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  const handleQuickAddPreset = async (preset) => {
    try {
      await createHost(preset);
      loadHosts();
    } catch (e) {
      alert('Erro ao adicionar preset: ' + e.message);
    }
  };

  // Group hosts
  const groups = hosts.reduce((acc, h) => {
    const grp = h.group || 'Geral';
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(h);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-slate-100">
      {/* Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-[#30363d] flex items-center justify-between shrink-0 bg-[#161b22]/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 
              className="text-sm sm:text-base font-bold text-white leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Gerenciador de Hosts & Conexões
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Servidores locais, projetos e instâncias remotas SSH
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="min-h-[38px] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="whitespace-nowrap">Novo Host</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs font-medium">
            Carregando conexões...
          </div>
        ) : Object.keys(groups).length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 text-center max-w-2xl mx-auto my-6 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-4 text-blue-400">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-2">Nenhuma Conexão Cadastrada</h3>
            <p className="text-xs text-slate-300 mb-6 max-w-md mx-auto leading-relaxed">
              Crie atalhos para os seus ambientes locais, servidores SSH ou instâncias em nuvem. Clique em um dos modelos rápidos abaixo para começar em 1 clique:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <button
                type="button"
                onClick={() => handleQuickAddPreset({
                  label: 'Localhost (~)',
                  address: '127.0.0.1',
                  user: 'nader',
                  port: 22,
                  type: 'local',
                  group: 'Ambiente Local',
                  color: '#3fb950',
                  defaultCwd: '/home/nader'
                })}
                className="p-3.5 rounded-xl bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-blue-500/40 text-left transition-all active:scale-95 group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-emerald-400">
                  <Laptop className="w-4 h-4" />
                  <span>Terminal Local</span>
                </div>
                <div className="text-xs text-slate-400 font-medium">Diretório home padrão (~/)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAddPreset({
                  label: 'Servidor VPS Nuvem',
                  address: '192.168.1.100',
                  user: 'root',
                  port: 22,
                  type: 'ssh',
                  group: 'Nuvem & VPS',
                  color: '#58a6ff',
                  defaultCwd: '/root'
                })}
                className="p-3.5 rounded-xl bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-blue-500/40 text-left transition-all active:scale-95 group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-blue-400">
                  <Globe className="w-4 h-4" />
                  <span>Servidor SSH</span>
                </div>
                <div className="text-xs text-slate-400 font-medium">root@192.168.1.100:22</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAddPreset({
                  label: 'Termius Agent Suite',
                  address: '127.0.0.1',
                  user: 'nader',
                  port: 22,
                  type: 'local',
                  group: 'Projetos',
                  color: '#bc8cff',
                  defaultCwd: '/home/nader/Applications/termius-agent'
                })}
                className="p-3.5 rounded-xl bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-blue-500/40 text-left transition-all active:scale-95 group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-purple-400">
                  <Folder className="w-4 h-4" />
                  <span>Projeto Atual</span>
                </div>
                <div className="text-xs text-slate-400 font-medium">~/Applications/termius-agent</div>
              </button>
            </div>
          </div>
        ) : (
          Object.entries(groups).map(([groupName, groupHosts]) => (
            <div key={groupName} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Folder className="w-4 h-4 text-slate-400" />
                <span>{groupName}</span>
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">
                  ({groupHosts.length})
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupHosts.map((host) => {
                  const isLocal = host.type === 'local';
                  return (
                    <div
                      key={host.id}
                      onClick={() => onConnectHost(host)}
                      className="group bg-[#161b22] hover:bg-[#1c2128] border border-[#30363d] hover:border-blue-500/50 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div 
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${host.color || '#58a6ff'}20` }}
                            >
                              {isLocal ? (
                                <Laptop className="w-5 h-5" style={{ color: host.color || '#58a6ff' }} />
                              ) : (
                                <Globe className="w-5 h-5" style={{ color: host.color || '#58a6ff' }} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 
                                className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate"
                                style={{ textWrap: 'balance' }}
                              >
                                {host.label}
                              </h3>
                              <span className="text-xs text-slate-300 font-mono block truncate whitespace-nowrap">
                                {host.user}@{host.address}:{host.port}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDelete(host.id, e)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all opacity-80 group-hover:opacity-100"
                            title="Remover host"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {host.defaultCwd && (
                          <div className="text-xs text-slate-300 font-mono truncate bg-[#0d1117] px-2.5 py-1.5 rounded-lg border border-[#21262d] mt-2.5">
                            {host.defaultCwd}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#30363d]/60 flex items-center justify-between text-xs">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#21262d] text-slate-300 border border-[#30363d] whitespace-nowrap">
                          {host.type.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold group-hover:translate-x-1 transition-transform whitespace-nowrap">
                          <span>Conectar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Host Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 shadow-2xl safe-area-bottom">
            <h2 className="text-sm sm:text-base font-bold text-white mb-4">Adicionar Novo Host / Conexão</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Rótulo / Nome
                </label>
                <input
                  type="text"
                  required
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Ex: Servidor Produção"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Tipo
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="local">Terminal Local</option>
                    <option value="ssh">Conexão SSH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Grupo
                  </label>
                  <input
                    type="text"
                    value={form.group}
                    onChange={(e) => setForm({ ...form, group: e.target.value })}
                    placeholder="Ex: Projetos, Produção"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Endereço / Host
                  </label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Porta
                  </label>
                  <input
                    type="number"
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) })}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Usuário
                  </label>
                  <input
                    type="text"
                    value={form.user}
                    onChange={(e) => setForm({ ...form, user: e.target.value })}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Cor da Tag
                  </label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full h-[42px] bg-[#0d1117] border border-[#30363d] rounded-xl p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Pasta Inicial (CWD)
                </label>
                <input
                  type="text"
                  value={form.defaultCwd}
                  onChange={(e) => setForm({ ...form, defaultCwd: e.target.value })}
                  placeholder="/home/nader"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-blue-500"
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
                  Salvar Host
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
