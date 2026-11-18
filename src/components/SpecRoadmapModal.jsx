import React, { useState, useEffect } from 'react';
import { fetchSpecAndRoadmap, saveSpecAndRoadmap, exportSpecAndRoadmap } from '../services/api';
import { sendNotification } from '../services/notificationService';
import { 
  FileText, 
  Milestone, 
  CheckCircle2, 
  X, 
  RotateCcw, 
  Sparkles,
  Save,
  Edit3,
  Eye,
  Folder,
  Download,
  Check,
  ExternalLink,
  Code2,
  FileCode2,
  FilePlus2,
  AlertCircle
} from 'lucide-react';

export default function SpecRoadmapModal({
  conversationId,
  conversationTitle,
  workspace,
  isOpen,
  onClose,
  onResumeConversation
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('spec'); // 'spec' | 'roadmap' | 'files'
  const [isEditing, setIsEditing] = useState(false);
  const [editedSpec, setEditedSpec] = useState('');
  const [editedRoadmap, setEditedRoadmap] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadData(conversationId, workspace);
    } else {
      setIsEditing(false);
    }
  }, [isOpen, conversationId, workspace]);

  const loadData = async (convId, ws) => {
    setLoading(true);
    try {
      const res = await fetchSpecAndRoadmap(convId, ws);
      setData(res);
      setEditedSpec(res.rawSpecContent || '');
      setEditedRoadmap(res.rawRoadmapContent || '');
    } catch (err) {
      console.error('[SpecRoadmapModal] Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data || !conversationId) return;
    setSaving(true);
    try {
      const updated = await saveSpecAndRoadmap(conversationId, {
        workspace: data.workspace,
        specContent: editedSpec,
        roadmapContent: editedRoadmap
      });
      setData(updated);
      setIsEditing(false);
      setSavedToast(true);
      sendNotification({
        title: 'Documentação Salva',
        body: `Arquivo ${activeTab === 'spec' ? 'SPEC.md' : 'ROADMAP.md'} atualizado com sucesso no projeto!`
      });
      setTimeout(() => setSavedToast(false), 4000);
    } catch (err) {
      alert(`Falha ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Renderizador simplificado de Markdown limpo e seguro
  const renderSimpleMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-xl sm:text-2xl font-extrabold text-white pb-2 mb-4 border-b border-[#30363d] flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-purple-500 inline-block shrink-0" />
            <span>{line.replace('# ', '')}</span>
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-base sm:text-lg font-bold text-amber-200 mt-6 mb-3 pb-1 border-b border-[#21262d] flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-amber-400 inline-block shrink-0" />
            <span>{line.replace('## ', '')}</span>
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-blue-300 mt-4 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block shrink-0" />
            <span>{line.replace('### ', '')}</span>
          </h3>
        );
      }

      // Blockquotes / Metadata
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className="px-3 py-1.5 rounded-lg bg-[#161b22] border-l-4 border-purple-500 text-xs text-slate-300 my-1.5 font-mono">
            {line.replace('> ', '')}
          </div>
        );
      }

      // Checklist items
      if (line.trim().startsWith('- [x]') || line.trim().startsWith('- [X]')) {
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-emerald-300 my-1 ml-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{line.replace(/- \[[xX]\]/, '').trim()}</span>
          </div>
        );
      }
      if (line.trim().startsWith('- [ ]')) {
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-400 my-1 ml-2 font-medium">
            <div className="w-3.5 h-3.5 rounded border border-slate-500 shrink-0 mt-0.5" />
            <span>{line.replace(/- \[ \]/, '').trim()}</span>
          </div>
        );
      }

      // List bullets
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="text-xs text-slate-300 my-1 ml-4 list-disc leading-relaxed">
            {line.trim().replace(/^[-*]\s+/, '')}
          </li>
        );
      }

      // Divisor
      if (line.trim() === '---') {
        return <hr key={idx} className="border-[#30363d] my-4" />;
      }

      // Linha vazia
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Parágrafo padrão
      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed font-sans mb-1.5">
          {line}
        </p>
      );
    });
  };

  const currentContent = activeTab === 'spec' ? editedSpec : editedRoadmap;
  const currentFileName = activeTab === 'spec' ? 'SPEC.md' : 'ROADMAP.md';
  const hasCurrentReal = activeTab === 'spec' ? data?.hasRealSpec : data?.hasRealRoadmap;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none font-sans animate-fade-in">
      <div 
        className="w-full max-w-5xl h-[90vh] bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Superior */}
        <div className="px-5 py-3.5 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {data?.title || conversationTitle || 'Especificação do Projeto'}
                </h3>
                {hasCurrentReal ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold whitespace-nowrap">
                    Arquivo Real no Disco
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold whitespace-nowrap">
                    Template / Novo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono truncate">
                <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{data?.workspace?.replace('/home/nader', '~') || '~'}</span>
                <span>•</span>
                <span className="text-slate-300 font-semibold">{currentFileName}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#21262d] rounded-xl transition-colors cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Ações & Abas */}
        <div className="px-5 py-2.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setActiveTab('spec'); setIsEditing(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'spec'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>SPEC.md</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('roadmap'); setIsEditing(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roadmap'
                  ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Milestone className="w-4 h-4 text-blue-400" />
              <span>ROADMAP.md</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('files'); setIsEditing(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <FileCode2 className="w-4 h-4 text-purple-400" />
              <span>Arquivos ({data?.affectedFilesCount || 0})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'files' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isEditing
                      ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                      : 'bg-[#21262d] text-slate-300 hover:text-white border-[#30363d]'
                  }`}
                  title={isEditing ? "Alternar para Modo Leitura" : "Editar conteúdo Markdown diretamente"}
                >
                  {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5 text-purple-400" />}
                  <span>{isEditing ? 'Visualizar' : 'Editar Markdown'}</span>
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer disabled:opacity-50"
                    title="Gravar alterações diretamente no arquivo no disco"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Gravando...' : 'Salvar no Disco'}</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => loadData(conversationId, workspace)}
              className="p-1.5 rounded-xl bg-[#21262d] text-slate-400 hover:text-white border border-[#30363d] transition-colors cursor-pointer"
              title="Recarregar arquivo do disco"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notificação de Sucesso */}
        {savedToast && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/50 px-5 py-2 text-xs text-emerald-200 flex items-center justify-between animate-fade-in font-mono">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Documento gravado com sucesso no workspace: <strong>{data?.workspace}</strong></span>
            </div>
            <button onClick={() => setSavedToast(false)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-5 select-text bg-[#0d1117] font-sans">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs font-semibold gap-2">
              <RotateCcw className="w-6 h-6 animate-spin text-purple-400" />
              <span>Lendo documentação real do projeto no disco...</span>
            </div>
          ) : activeTab === 'files' ? (
            /* Visualizador de Arquivos Tocados na Sessão */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Arquivos Tocados e Modificados nesta Sessão ({data?.affectedFiles?.length || 0})
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Workspace: {data?.workspace}
                </span>
              </div>

              {data?.affectedFiles?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-semibold">
                  Nenhum arquivo modificado detectado no histórico desta conversa.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {data?.affectedFiles?.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-between text-xs font-mono text-slate-300 hover:border-purple-500/40 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <FileCode2 className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="truncate">{f.path.replace('/home/nader', '~')}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 shrink-0">
                        tocou
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : isEditing ? (
            /* Modo Editor Markdown */
            <div className="h-full flex flex-col">
              <textarea
                value={activeTab === 'spec' ? editedSpec : editedRoadmap}
                onChange={(e) => {
                  if (activeTab === 'spec') setEditedSpec(e.target.value);
                  else setEditedRoadmap(e.target.value);
                }}
                className="w-full flex-1 bg-[#161b22] text-slate-200 border border-[#30363d] focus:border-purple-500/60 rounded-xl p-4 font-mono text-xs leading-relaxed outline-none resize-none selection:bg-purple-600/30"
                placeholder={`Conteúdo Markdown do ${currentFileName}...`}
                spellCheck={false}
              />
            </div>
          ) : (
            /* Modo Leitura / Visualizador Formatado */
            <div className="max-w-4xl mx-auto bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-md">
              {!hasCurrentReal && (
                <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Este projeto ainda não possui um arquivo <code>{currentFileName}</code> no disco. Você pode editá-lo e clicar em <strong>"Salvar no Disco"</strong> para criá-lo agora!</span>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black font-bold text-xs transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Personalizar
                  </button>
                </div>
              )}
              {renderSimpleMarkdown(currentContent)}
            </div>
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="px-5 py-2.5 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between text-xs text-slate-400 font-mono shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span>Caminho:</span>
            <code className="text-purple-300 truncate">
              {activeTab === 'spec' ? data?.specPath : activeTab === 'roadmap' ? data?.roadmapPath : data?.workspace}
            </code>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {onResumeConversation && (
              <button
                type="button"
                onClick={() => {
                  onResumeConversation(conversationId, conversationTitle || 'Conversa IA', data?.workspace || '/home/nader', true);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs transition-all cursor-pointer"
                title="Abrir terminal e retomar sessão neste workspace"
              >
                <span>⚡ Abrir no Terminal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
