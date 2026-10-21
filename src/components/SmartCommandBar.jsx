import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchCommandSuggestions } from '../services/api';
import { 
  Sparkles, 
  Search, 
  Play, 
  CornerDownLeft, 
  Copy, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon,
  Terminal,
  Folder,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function SmartCommandBar({
  cwd = '/home/nader',
  onExecuteCommand,
  onInjectCommand,
  isOpen = true,
  onToggle
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Carrega sugestões quando cwd, query ou categoria mudam
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchCommandSuggestions(query, cwd, activeCategory);
        if (active) {
          setSuggestions(Array.isArray(data) ? data : []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('[SmartCommandBar] Erro ao carregar sugestões:', err);
      } finally {
        if (active) setLoading(false);
      }
    }, 80);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, cwd, activeCategory]);

  // Navegação por teclado dentro do campo de busca
  const handleKeyDown = (e) => {
    if (!suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      scrollToIndex((selectedIndex + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      scrollToIndex((selectedIndex - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = suggestions[selectedIndex];
      if (target && onExecuteCommand) {
        onExecuteCommand(target.command, true);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const target = suggestions[selectedIndex];
      if (target && onInjectCommand) {
        onInjectCommand(target.command, false);
      } else if (target && onExecuteCommand) {
        onExecuteCommand(target.command, false);
      }
    } else if (e.key === 'Escape') {
      if (query) {
        setQuery('');
      } else if (onToggle) {
        onToggle();
      }
    }
  };

  const scrollToIndex = (index) => {
    if (!listRef.current) return;
    const items = listRef.current.children;
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  const handleCopy = (cmd, id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'antigravity', label: '🤖 Antigravity AI' },
    { id: 'package_json', label: '📦 NPM Scripts' },
    { id: 'git', label: '⚡ Git' },
    { id: 'snippet', label: '📋 Snippets' },
    { id: 'system', label: '🔧 Sistema' }
  ];

  const renderRiskBadge = (risk) => {
    switch (risk) {
      case 'destructive':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            Destrutivo
          </span>
        );
      case 'caution':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Atenção
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Seguro
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full bg-[#161b22] border-t border-[#30363d] shadow-2xl flex flex-col shrink-0 select-none transition-all duration-200 z-20">
      {/* Top Header / Search Input Bar */}
      <div className="h-11 px-3 flex items-center justify-between gap-2.5 bg-[#1c2128]/95 border-b border-[#30363d]/70">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-md bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          </div>

          <div className="relative flex-1 min-w-0 flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Smart Bar: busque comandos do Antigravity, scripts ou utilitários... (↑↓ navegar, Tab inserir, Enter executar)"
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-purple-500/80 rounded-lg pl-8 pr-3 py-1.5 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 font-mono"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 p-0.5 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="hidden md:flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#30363d] transition-colors"
            title={isExpanded ? 'Recolher sugestões' : 'Expandir sugestões'}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-[#30363d] transition-colors"
              title="Fechar Smart Command Bar (Ctrl + Space)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Suggestions List */}
      {isExpanded && (
        <div className="max-h-56 overflow-y-auto divide-y divide-[#21262d] bg-[#0d1117] p-1.5" ref={listRef}>
          {loading && suggestions.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span>Buscando comandos contextuais no cérebro do Antigravity...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-5 text-center text-xs text-slate-500 font-mono">
              Nenhuma sugestão encontrada para "{query}".
            </div>
          ) : (
            suggestions.map((item, index) => {
              const isSelected = index === selectedIndex;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id || index}
                  onClick={() => {
                    setSelectedIndex(index);
                    if (onExecuteCommand) onExecuteCommand(item.command, true);
                  }}
                  className={`group p-2 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#1c2128] border border-purple-500/40 shadow-xs'
                      : 'hover:bg-[#161b22] border border-transparent'
                  }`}
                >
                  {/* Left: Command and Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#21262d] text-slate-300 border border-[#30363d] shrink-0 font-semibold whitespace-nowrap">
                        {item.sourceLabel || item.source}
                      </span>
                      {renderRiskBadge(item.risk)}
                      <span className="text-xs text-slate-400 truncate">
                        {item.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs text-purple-200 select-text font-medium truncate">
                      <Terminal className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{item.command}</span>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(item.command, item.id, e)}
                      className="p-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white transition-colors"
                      title="Copiar comando"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onInjectCommand) onInjectCommand(item.command, false);
                        else if (onExecuteCommand) onExecuteCommand(item.command, false);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] text-xs font-mono transition-colors active:scale-95 whitespace-nowrap"
                      title="Inserir no prompt sem executar (Tab)"
                    >
                      <CornerDownLeft className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Inserir</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onExecuteCommand) onExecuteCommand(item.command, true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
                      title="Executar imediatamente no terminal (Enter)"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Executar</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Footer shortcut hints */}
      <div className="h-6 px-3 bg-[#161b22] border-t border-[#30363d]/50 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span><kbd className="text-slate-400">↑↓</kbd> navegar</span>
          <span><kbd className="text-slate-400">Tab</kbd> inserir</span>
          <span><kbd className="text-slate-400">Enter</kbd> executar</span>
          <span><kbd className="text-slate-400">Esc</kbd> limpar</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <Folder className="w-2.5 h-2.5" />
          <span className="truncate">{cwd.replace('/home/nader', '~')}</span>
        </div>
      </div>
    </div>
  );
}
