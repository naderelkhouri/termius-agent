import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchSkills, fetchSkillDetail } from '../services/api';
import { 
  Sparkles, 
  Search, 
  X, 
  Copy, 
  Check, 
  Terminal, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  Code2, 
  Database, 
  Zap, 
  Flame, 
  ChevronRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function SkillsDropdownModal({
  isOpen,
  onClose,
  onAdoptSkillInTerminal
}) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [detailSkill, setDetailSkill] = useState(null);
  const [detailContent, setDetailContent] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadSkills();
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const data = await fetchSkills();
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[SkillsModal] Erro ao buscar skills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (name, id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(name);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleOpenDetail = async (skill, e) => {
    if (e) e.stopPropagation();
    setDetailSkill(skill);
    setDetailLoading(true);
    try {
      const res = await fetchSkillDetail(skill.name);
      setDetailContent(res?.content || 'Diretrizes não encontradas.');
    } catch (err) {
      setDetailContent('Erro ao carregar diretrizes da skill.');
    } finally {
      setDetailLoading(false);
    }
  };

  const categories = useMemo(() => {
    const counts = {};
    skills.forEach((s) => {
      const cat = s.category || 'Outros';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const list = [
      { id: 'all', label: 'Todas as Skills', count: skills.length },
      { id: 'Frontend & UI/UX', label: '🎨 Frontend & UI/UX', count: counts['Frontend & UI/UX'] || 0 },
      { id: 'Backend & Bancos de Dados', label: '⚙️ Backend & APIs', count: counts['Backend & Bancos de Dados'] || 0 },
      { id: 'Segurança & Auditoria', label: '🛡️ Segurança & Auditoria', count: counts['Segurança & Auditoria'] || 0 },
      { id: 'QA, Testes & Resiliência', label: '🧪 QA & Testes', count: counts['QA, Testes & Resiliência'] || 0 },
      { id: 'Growth, Marketing & Social', label: '📈 Growth & Marketing', count: counts['Growth, Marketing & Social'] || 0 },
      { id: 'IA, Prompts & Agentes', label: '🤖 IA & Agentes', count: counts['IA, Prompts & Agentes'] || 0 },
      { id: 'DevOps, Nuvem & Infra', label: '🛠️ DevOps & Nuvem', count: counts['DevOps, Nuvem & Infra'] || 0 },
      { id: 'Games, 3D & Spatial', label: '🎮 Games & 3D', count: counts['Games, 3D & Spatial'] || 0 },
      { id: 'Negócios, Vendas & Finanças', label: '💼 Negócios & Vendas', count: counts['Negócios, Vendas & Finanças'] || 0 },
      { id: 'Mobile, Flutter & App', label: '📱 Mobile & Apps', count: counts['Mobile, Flutter & App'] || 0 }
    ];

    return list.filter((c) => c.id === 'all' || c.count > 0);
  }, [skills]);

  const filteredSkills = useMemo(() => {
    let result = skills;
    if (selectedCategory !== 'all') {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [skills, selectedCategory, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none font-sans animate-fade-in">
      <div 
        className="w-full max-w-5xl h-[88vh] bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="h-16 px-5 bg-[#1c2128] border-b border-[#30363d] flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white flex items-center gap-2 truncate">
                Catálogo de Skills & Especialistas da Agência
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {skills.length} Habilidades em PT-BR
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Personas, diretrizes técnicas e protocolos avançados prontas para acoplar no terminal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Stats */}
        <div className="p-4 border-b border-[#30363d] bg-[#0d1117] flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar skill por nome, tecnologia ou função (ex: frontend, backend, sql, auditor, seo)..."
              className="w-full bg-[#161b22] border border-[#30363d] focus:border-purple-500/80 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 font-mono shrink-0">
            Exibindo <span className="text-purple-300 font-bold">{filteredSkills.length}</span> de {skills.length} skills
          </div>
        </div>

        {/* Main Body: Categories Sidebar + Skills Grid */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Categories Sidebar */}
          <div className="w-56 border-r border-[#30363d] bg-[#161b22]/70 p-3 overflow-y-auto space-y-1 shrink-0 hidden md:block">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
              Categorias
            </div>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-purple-600/25 text-purple-200 border border-purple-500/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0d1117] text-slate-400 border border-[#30363d]/60 shrink-0">
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Skills Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0d1117]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs font-semibold gap-2">
                <Sparkles className="w-6 h-6 text-purple-400 animate-spin" />
                <span>Carregando catálogo de 340 skills em Português BR...</span>
              </div>
            ) : filteredSkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs text-center p-4">
                <Layers className="w-8 h-8 text-slate-600 mb-2" />
                <p>Nenhuma skill encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              filteredSkills.map((s) => {
                const isCopied = copiedId === s.id;
                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                          {s.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {s.name}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-[#21262d] text-slate-300 border border-[#30363d]">
                          {s.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 select-text">
                        {s.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopy(s.name, s.id, e)}
                        className="px-2 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                        title="Copiar nome da skill"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        <span className="hidden sm:inline">Copiar</span>
                      </button>

                      {s.hasDetails && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenDetail(s, e)}
                          className="px-2 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                          title="Ver diretrizes completas da skill"
                        >
                          <BookOpen className="w-3 h-3 text-cyan-400" />
                          <span className="hidden sm:inline">Diretrizes</span>
                        </button>
                      )}

                      {onAdoptSkillInTerminal && (
                        <button
                          type="button"
                          onClick={() => {
                            onAdoptSkillInTerminal(s.name, s.title);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                          title="Adotar esta persona no terminal ativo"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Adotar Persona</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Drawer de Detalhes da Skill */}
        {detailSkill && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-xs flex justify-end animate-fade-in">
            <div className="w-full max-w-2xl h-full bg-[#161b22] border-l border-[#30363d] shadow-2xl flex flex-col overflow-hidden">
              <div className="h-14 px-4 bg-[#1c2128] border-b border-[#30363d] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                      {detailSkill.title}
                    </h3>
                    <p className="text-[10px] font-mono text-purple-300 truncate">
                      @{detailSkill.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailSkill(null)}
                  className="w-7 h-7 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 select-text">
                {detailLoading ? (
                  <div className="flex items-center justify-center h-48 text-xs text-slate-400">
                    Carregando diretrizes...
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {detailContent}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-[#30363d] bg-[#1c2128] flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-400 font-mono">
                  {detailSkill.category}
                </span>
                {onAdoptSkillInTerminal && (
                  <button
                    type="button"
                    onClick={() => {
                      onAdoptSkillInTerminal(detailSkill.name, detailSkill.title);
                      setDetailSkill(null);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Adotar no Terminal Agora</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="h-10 px-5 bg-[#1c2128] border-t border-[#30363d] flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>The Agency Protocol ativo • 340 especialidades disponíveis</span>
          </div>
          <div className="hidden sm:block font-mono text-[11px]">
            Pressione <kbd className="bg-[#21262d] px-1.5 py-0.5 rounded text-white border border-[#30363d]">Esc</kbd> para fechar
          </div>
        </div>
      </div>
    </div>
  );
}
