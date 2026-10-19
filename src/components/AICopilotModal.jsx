import React, { useState, useEffect, useRef } from 'react';
import { fetchCopilotSuggestion, createSnippet } from '../services/api';
import { 
  Sparkles, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  X, 
  BookmarkPlus, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  CornerDownLeft 
} from 'lucide-react';

export default function AICopilotModal({ isOpen, onClose, onExecuteCommand, currentCwd }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [copied, setCopied] = useState(false);
  const [savedSnippet, setSavedSnippet] = useState(false);
  const inputRef = useRef(null);

  const presets = [
    'Portas abertas e processos',
    'Uso de memória e swap',
    '15 maiores pastas em disco',
    'Containers Docker ativos',
    'Git log visual formatado',
    'Matar processo na porta 3000'
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSuggestion(null);
      setCopied(false);
      setSavedSnippet(false);
    }
  }, [isOpen]);

  const handleSearch = async (textToSearch = query) => {
    const q = textToSearch || query;
    if (!q || !q.trim()) return;
    setLoading(true);
    setCopied(false);
    setSavedSnippet(false);
    try {
      const res = await fetchCopilotSuggestion(q, currentCwd);
      setSuggestion(res);
    } catch (e) {
      console.error(e);
      setSuggestion({
        command: 'echo "Erro ao conectar com o Copilot"',
        explanation: 'Falha temporária ao gerar comando.',
        risk: 'caution',
        source: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (suggestion && !e.shiftKey) {
        handleExecute();
      } else {
        handleSearch();
      }
    }
  };

  const handleExecute = () => {
    if (!suggestion || !suggestion.command) return;
    onExecuteCommand(suggestion.command);
    onClose();
  };

  const handleCopy = () => {
    if (!suggestion || !suggestion.command) return;
    navigator.clipboard.writeText(suggestion.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSnippet = async () => {
    if (!suggestion || !suggestion.command) return;
    try {
      await createSnippet({
        title: query || 'Comando do Copilot',
        command: suggestion.command,
        category: 'Copilot IA'
      });
      setSavedSnippet(true);
      setTimeout(() => setSavedSnippet(false), 2500);
    } catch (e) {
      alert('Erro ao salvar snippet: ' + e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Top Header */}
        <div className="p-4 px-5 border-b border-[#30363d] flex items-center justify-between bg-[#1c2128]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>AI Terminal Copilot</span>
                <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                  Ctrl + K
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gere comandos de shell seguros em linguagem natural
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-[#30363d] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Box */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Terminal className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você precisa fazer? (ex: portas abertas, limpar containers, git log gráfico...)"
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-purple-500 rounded-xl pl-10 pr-24 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{loading ? 'Gerando...' : 'Gerar'}</span>
            </button>
          </div>

          {/* Quick Preset Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400">Exemplos rápidos:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(p);
                  handleSearch(p);
                }}
                className="text-xs bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-[#30363d] transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Generated Result Card */}
          {suggestion && (
            <div className="mt-4 p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {suggestion.risk === 'safe' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Comando Seguro
                    </span>
                  )}
                  {suggestion.risk === 'caution' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Requer Atenção
                    </span>
                  )}
                  {suggestion.risk === 'destructive' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Ação Destrutiva / Irreversível
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400 uppercase">
                    Fonte: {suggestion.source}
                  </span>
                </div>
              </div>

              {/* Command Codeblock / Editable */}
              <div className="relative group">
                <textarea
                  rows={2}
                  value={suggestion.command}
                  onChange={(e) => setSuggestion({ ...suggestion, command: e.target.value })}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-purple-500 select-text leading-relaxed resize-none"
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {suggestion.explanation}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-[#21262d] flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="min-h-[34px] flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-200 text-xs font-semibold transition-colors active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={handleSaveSnippet}
                    className="min-h-[34px] flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-200 text-xs font-semibold transition-colors active:scale-95"
                  >
                    {savedSnippet ? <Check className="w-3.5 h-3.5 text-purple-400" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                    <span>{savedSnippet ? 'Salvo em Snippets!' : 'Salvar Snippet'}</span>
                  </button>
                </div>

                <button
                  onClick={handleExecute}
                  className="min-h-[34px] flex items-center gap-2 px-4 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Executar no Terminal Ativo</span>
                  <CornerDownLeft className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
