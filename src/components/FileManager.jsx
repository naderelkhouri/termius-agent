import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  fetchFsList, 
  fetchFsReadFile, 
  saveFsFile, 
  createFsDirectory, 
  createFsFile, 
  deleteFsPath, 
  renameFsPath, 
  fetchRemoteFsList,
  fetchHosts 
} from '../services/api';
import { copyToClipboard } from '../services/clipboardService';
import { 
  Folder, 
  FolderTree, 
  FolderOpen, 
  FolderPlus, 
  FolderGit2, 
  File, 
  FileText, 
  FileCode2, 
  FileJson2, 
  FileArchive, 
  FileImage, 
  FileSpreadsheet, 
  FileTerminal, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  ChevronRight, 
  Pencil, 
  Trash2, 
  ExternalLink, 
  Terminal, 
  Copy, 
  Check, 
  Eye, 
  Save, 
  X, 
  HardDrive, 
  Server, 
  Clock, 
  Lock, 
  AlertCircle,
  Laptop,
  CheckCircle2
} from 'lucide-react';

// Função para mapear extensão para ícone e cor específica
function getFileIcon(item) {
  if (item.isDirectory) {
    if (item.name === '.git') return { Icon: FolderGit2, color: 'text-amber-400' };
    return { Icon: Folder, color: 'text-blue-400' };
  }

  const ext = (item.extension || '').toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'mjs':
    case 'cjs':
      return { Icon: FileCode2, color: 'text-yellow-400' };
    case 'json':
      return { Icon: FileJson2, color: 'text-amber-500' };
    case 'py':
      return { Icon: FileCode2, color: 'text-sky-400' };
    case 'sh':
    case 'bash':
    case 'zsh':
      return { Icon: FileTerminal, color: 'text-emerald-400' };
    case 'md':
    case 'markdown':
    case 'txt':
    case 'log':
      return { Icon: FileText, color: 'text-purple-400' };
    case 'html':
    case 'css':
    case 'scss':
      return { Icon: FileCode2, color: 'text-rose-400' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
      return { Icon: FileImage, color: 'text-pink-400' };
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
    case 'rar':
      return { Icon: FileArchive, color: 'text-orange-400' };
    case 'csv':
    case 'xls':
    case 'xlsx':
      return { Icon: FileSpreadsheet, color: 'text-teal-400' };
    default:
      return { Icon: File, color: 'text-slate-400' };
  }
}

export default function FileManager({ onOpenTerminalAt, onCdActiveTerminal }) {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [hosts, setHosts] = useState([]);
  const [selectedHost, setSelectedHost] = useState(null); // null = Localhost

  // Modais de Criação, Edição, Renomeação e Exclusão
  const [editorFile, setEditorFile] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);

  const [createModal, setCreateModal] = useState({ open: false, type: 'file', name: '' });
  const [renameModal, setRenameModal] = useState({ open: false, item: null, newName: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [copiedPath, setCopiedPath] = useState(null);

  const searchInputRef = useRef(null);

  // Carregar hosts e diretório inicial
  useEffect(() => {
    loadSavedHosts();
    loadDirectory('');
  }, []);

  const loadSavedHosts = async () => {
    try {
      const data = await fetchHosts();
      setHosts(data || []);
    } catch (e) {
      console.error('[FileManager] Erro ao carregar hosts:', e);
    }
  };

  const showNotification = (msg) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(''), 3000);
  };

  const loadDirectory = async (dirPath = currentPath) => {
    setLoading(true);
    setError(null);
    try {
      if (selectedHost && selectedHost.type === 'ssh') {
        const data = await fetchRemoteFsList(selectedHost.id, dirPath, showHidden);
        if (data.error) {
          setError(data.error);
        } else {
          setItems(data.items || []);
          setCurrentPath(data.currentPath || dirPath);
        }
      } else {
        const data = await fetchFsList(dirPath, showHidden);
        if (data.error) {
          setError(data.error);
        } else {
          setItems(data.items || []);
          setCurrentPath(data.currentPath || dirPath);
          setBreadcrumbs(data.breadcrumbs || []);
        }
      }
    } catch (err) {
      setError(err.message || 'Falha ao ler diretório');
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando alternar visualização de arquivos ocultos
  const handleToggleHidden = () => {
    const nextHidden = !showHidden;
    setShowHidden(nextHidden);
    if (!selectedHost || selectedHost.type !== 'ssh') {
      fetchFsList(currentPath, nextHidden).then(data => {
        if (!data.error) setItems(data.items || []);
      });
    } else {
      fetchRemoteFsList(selectedHost.id, currentPath, nextHidden).then(data => {
        if (!data.error) setItems(data.items || []);
      });
    }
  };

  const handleSelectHost = (host) => {
    setSelectedHost(host);
    setSearchTerm('');
    if (!host || host.type === 'local') {
      loadDirectory(host?.defaultCwd || '');
    } else {
      loadDirectory(host.defaultCwd || '~');
    }
  };

  const handleNavigate = (path) => {
    setSearchTerm('');
    loadDirectory(path);
  };

  const handleNavigateUp = () => {
    if (!currentPath || currentPath === '/') return;
    const parent = currentPath.replace(/\/[^/]+$/, '') || '/';
    handleNavigate(parent);
  };

  // Abertura e Edição de Arquivo
  const handleOpenFile = async (item) => {
    if (item.isDirectory) {
      handleNavigate(item.path);
      return;
    }

    if (item.isBinary) {
      showNotification(`Arquivo binário (${item.name}) não suporta edição de texto direta`);
      return;
    }

    setEditorFile(item);
    setEditorLoading(true);
    setEditorDirty(false);
    try {
      const data = await fetchFsReadFile(item.path);
      if (data.isBinary) {
        showNotification('Arquivo binário detectado');
        setEditorFile(null);
      } else {
        setEditorContent(data.content || '');
      }
    } catch (err) {
      showNotification(`Erro ao abrir arquivo: ${err.message}`);
      setEditorFile(null);
    } finally {
      setEditorLoading(false);
    }
  };

  const handleSaveEditorFile = async () => {
    if (!editorFile) return;
    setEditorSaving(true);
    try {
      await saveFsFile(editorFile.path, editorContent);
      setEditorDirty(false);
      showNotification(`Arquivo '${editorFile.name}' salvo com sucesso!`);
      loadDirectory(currentPath);
    } catch (err) {
      showNotification(`Erro ao salvar arquivo: ${err.message}`);
    } finally {
      setEditorSaving(false);
    }
  };

  // Criar Pasta / Arquivo
  const handleConfirmCreate = async () => {
    const name = createModal.name.trim();
    if (!name) return;

    const targetPath = currentPath.endsWith('/') 
      ? `${currentPath}${name}` 
      : `${currentPath}/${name}`;

    try {
      if (createModal.type === 'folder') {
        await createFsDirectory(targetPath);
        showNotification(`Pasta '${name}' criada com sucesso`);
      } else {
        await createFsFile(targetPath, '');
        showNotification(`Arquivo '${name}' criado com sucesso`);
      }
      setCreateModal({ open: false, type: 'file', name: '' });
      loadDirectory(currentPath);
    } catch (err) {
      showNotification(`Erro: ${err.message}`);
    }
  };

  // Renomear
  const handleConfirmRename = async () => {
    const newName = renameModal.newName.trim();
    if (!renameModal.item || !newName || newName === renameModal.item.name) {
      setRenameModal({ open: false, item: null, newName: '' });
      return;
    }

    const parentDir = currentPath.endsWith('/') ? currentPath : `${currentPath}/`;
    const newPath = `${parentDir}${newName}`;

    try {
      await renameFsPath(renameModal.item.path, newPath);
      showNotification(`Renomeado para '${newName}' com sucesso`);
      setRenameModal({ open: false, item: null, newName: '' });
      loadDirectory(currentPath);
    } catch (err) {
      showNotification(`Erro ao renomear: ${err.message}`);
    }
  };

  // Excluir
  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    try {
      await deleteFsPath(deleteModal.item.path);
      showNotification(`'${deleteModal.item.name}' excluído com sucesso`);
      setDeleteModal({ open: false, item: null });
      loadDirectory(currentPath);
    } catch (err) {
      showNotification(`Erro ao excluir: ${err.message}`);
    }
  };

  // Abrir no VS Code
  const handleOpenInVSCode = (filePath) => {
    if (window.electronAPI && window.electronAPI.openFile) {
      window.electronAPI.openFile(filePath);
      showNotification('Abrindo no VS Code...');
    } else {
      fetch('/api/system/open-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      })
      .then(() => showNotification('Abrindo no VS Code...'))
      .catch((err) => showNotification(`Erro: ${err.message}`));
    }
  };

  // Copiar Caminho
  const handleCopyPath = (path) => {
    copyToClipboard(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  // Filtragem
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(term));
  }, [items, searchTerm]);

  // Atalhos Rápidos de Diretório
  const quickBookmarks = [
    { label: 'Home (~)', path: '/home/nader', icon: HardDrive },
    { label: 'Applications', path: '/home/nader/Applications', icon: FolderTree },
    { label: 'Invest-X', path: '/home/nader/invest-x', icon: Folder },
    { label: 'Mercado App', path: '/home/nader/Applications/mercado-app', icon: Folder },
    { label: 'Termius Agent', path: '/home/nader/Applications/termius-agent', icon: Folder },
    { label: 'Downloads', path: '/home/nader/Downloads', icon: Folder },
    { label: 'Raiz (/)', path: '/', icon: Server },
  ];

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-[#0d1117] text-slate-200 select-none overflow-hidden">
      {/* Toast de Notificação */}
      {actionSuccessMessage && (
        <div className="absolute top-4 right-4 z-50 bg-[#161b22] border border-blue-500/50 text-blue-300 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Sidebar Lateral de Bookmarks e Hosts */}
      <div className="w-full md:w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col shrink-0">
        <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <FolderTree className="w-4 h-4 text-blue-400" />
            <span>Explorador & SFTP</span>
          </div>
          <button 
            type="button"
            onClick={() => loadDirectory(currentPath)}
            className="p-1 hover:bg-[#21262d] text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Recarregar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>

        {/* Lista de Hosts / Conexões */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          <div>
            <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Hosts & Ambientes
            </div>
            <div className="space-y-0.5 mt-1">
              <button
                type="button"
                onClick={() => handleSelectHost(null)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                  selectedHost === null 
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                    : 'text-slate-300 hover:bg-[#21262d]'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate flex-1">Localhost (Ubuntu)</span>
                <span className="text-xs font-mono text-emerald-400/80">local</span>
              </button>

              {hosts.map(h => {
                const isSelected = selectedHost?.id === h.id;
                const isSsh = h.type === 'ssh';
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleSelectHost(h)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                        : 'text-slate-300 hover:bg-[#21262d]'
                    }`}
                  >
                    <Server 
                      className="w-3.5 h-3.5 shrink-0" 
                      style={{ color: h.color || (isSsh ? '#f85149' : '#58a6ff') }} 
                    />
                    <span className="truncate flex-1">{h.label}</span>
                    <span 
                      className={`text-xs font-mono px-1 rounded ${
                        isSsh ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {h.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Marcadores Rápidos do Sistema de Arquivos */}
          {!selectedHost && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Marcadores Rápidos
              </div>
              <div className="space-y-0.5 mt-1">
                {quickBookmarks.map((b) => {
                  const Icon = b.icon;
                  const isActive = currentPath === b.path;
                  return (
                    <button
                      key={b.path}
                      type="button"
                      onClick={() => handleNavigate(b.path)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                        isActive 
                          ? 'bg-[#21262d] text-white border border-[#30363d]' 
                          : 'text-slate-300 hover:bg-[#21262d] hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{b.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-2 border-t border-[#30363d] bg-[#0d1117]/60 flex items-center justify-between text-xs text-slate-400">
          <span>{items.length} itens</span>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
            <input 
              type="checkbox" 
              checked={showHidden} 
              onChange={handleToggleHidden}
              className="rounded bg-[#21262d] border-[#30363d] text-blue-500 focus:ring-0 cursor-pointer"
            />
            <span>Ocultos</span>
          </label>
        </div>
      </div>

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Barra de Ferramentas Superior & Breadcrumbs */}
        <div className="p-3 bg-[#161b22] border-b border-[#30363d] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          {/* Breadcrumb Navegável */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none min-w-0">
            <button
              type="button"
              onClick={handleNavigateUp}
              disabled={!currentPath || currentPath === '/'}
              className="p-1.5 rounded-lg hover:bg-[#21262d] text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer shrink-0"
              title="Diretório Superior (..)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {breadcrumbs.length > 0 ? (
              breadcrumbs.map((b, idx) => (
                <React.Fragment key={b.path}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  <button
                    type="button"
                    onClick={() => handleNavigate(b.path)}
                    className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      idx === breadcrumbs.length - 1 
                        ? 'bg-[#21262d] text-blue-300 font-bold' 
                        : 'text-slate-400 hover:text-white hover:bg-[#21262d]/60'
                    }`}
                  >
                    {b.label}
                  </button>
                </React.Fragment>
              ))
            ) : (
              <span className="text-xs font-mono text-slate-400 px-2 truncate">
                {currentPath || '~'}
              </span>
            )}
          </div>

          {/* Ações & Busca */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Campo de Busca Rápida */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Filtrar arquivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-36 sm:w-48 bg-[#0d1117] border border-[#30363d] rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Novo Arquivo */}
            <button
              type="button"
              onClick={() => setCreateModal({ open: true, type: 'file', name: '' })}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-slate-500 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Novo Arquivo"
            >
              <File className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Arquivo</span>
            </button>

            {/* Nova Pasta */}
            <button
              type="button"
              onClick={() => setCreateModal({ open: true, type: 'folder', name: '' })}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-slate-500 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Nova Pasta"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Pasta</span>
            </button>

            {/* Abrir no Terminal */}
            <button
              type="button"
              onClick={() => onOpenTerminalAt && onOpenTerminalAt(currentPath)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="Abrir nova aba de terminal neste diretório"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Terminal</span>
            </button>
          </div>
        </div>

        {/* Lista de Arquivos (Tabela Moderna) */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-[#0d1117]">
          {error ? (
            <div className="p-8 text-center max-w-md mx-auto space-y-3">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <h3 className="text-white text-sm font-bold">Falha ao acessar caminho</h3>
              <p className="text-xs text-slate-400">{error}</p>
              <button
                type="button"
                onClick={() => handleNavigate('/home/nader')}
                className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Voltar para Pasta Inicial (~/)
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Carregando arquivos...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-semibold text-slate-400">Nenhum arquivo encontrado</p>
                  <p className="text-slate-500">O diretório está vazio ou nenhum arquivo coincide com o filtro de busca.</p>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#161b22] text-slate-400 font-semibold border-b border-[#30363d] z-10 select-none">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Nome</th>
                  <th className="py-2.5 px-3 font-semibold w-24 text-right">Tamanho</th>
                  <th className="py-2.5 px-3 font-semibold w-28 hidden md:table-cell font-mono">Permissões</th>
                  <th className="py-2.5 px-3 font-semibold w-40 hidden lg:table-cell">Modificado</th>
                  <th className="py-2.5 px-3 font-semibold w-32 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]/60 font-sans">
                {filteredItems.map((item) => {
                  const { Icon, color } = getFileIcon(item);
                  const isCopied = copiedPath === item.path;

                  return (
                    <tr
                      key={item.path}
                      onDoubleClick={() => handleOpenFile(item)}
                      className="group hover:bg-[#161b22]/70 transition-colors cursor-pointer"
                    >
                      {/* Nome com Ícone */}
                      <td 
                        className="py-2 px-3 flex items-center gap-2.5 min-w-0"
                        onClick={() => handleOpenFile(item)}
                      >
                        <Icon className={`w-4 h-4 ${color} shrink-0`} />
                        <span 
                          className={`truncate font-medium ${
                            item.isDirectory ? 'text-blue-300 hover:underline' : 'text-slate-200'
                          }`}
                          title={item.name}
                        >
                          {item.name}
                        </span>
                        {item.isSymlink && (
                          <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-1 rounded">link</span>
                        )}
                      </td>

                      {/* Tamanho */}
                      <td className="py-2 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                        {item.sizeFormatted}
                      </td>

                      {/* Permissões */}
                      <td className="py-2 px-3 font-mono text-slate-400 hidden md:table-cell whitespace-nowrap">
                        {item.permissions}
                      </td>

                      {/* Data de Modificação */}
                      <td className="py-2 px-3 text-slate-400 hidden lg:table-cell whitespace-nowrap font-mono">
                        {item.mtime ? new Date(item.mtime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>

                      {/* Ações Rápidas (Aparecem em hover) */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Visualizar / Editar */}
                          {!item.isDirectory && !item.isBinary && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleOpenFile(item); }}
                              className="p-1 hover:bg-[#30363d] text-slate-400 hover:text-blue-300 rounded transition-colors"
                              title="Visualizar / Editar Inline"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Abrir no VS Code */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenInVSCode(item.path); }}
                            className="p-1 hover:bg-[#30363d] text-slate-400 hover:text-emerald-300 rounded transition-colors"
                            title="Abrir no Editor Externo (VS Code)"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Copiar Caminho */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCopyPath(item.path); }}
                            className="p-1 hover:bg-[#30363d] text-slate-400 hover:text-white rounded transition-colors"
                            title={isCopied ? 'Caminho copiado!' : 'Copiar Caminho'}
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Renomear */}
                          <button
                            type="button"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setRenameModal({ open: true, item, newName: item.name }); 
                            }}
                            className="p-1 hover:bg-[#30363d] text-slate-400 hover:text-amber-300 rounded transition-colors"
                            title="Renomear"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Excluir */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, item }); }}
                            className="p-1 hover:bg-[#30363d] text-slate-400 hover:text-red-400 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: Editor de Arquivos Inline */}
      {editorFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header do Editor */}
            <div className="px-5 py-3 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <FileCode2 className="w-5 h-5 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white text-sm font-bold truncate">
                      {editorFile.name}
                    </h3>
                    {editorDirty && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Alterações não salvas" />
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-400 truncate">
                    {editorFile.path} • {editorFile.sizeFormatted}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Abrir no VS Code */}
                <button
                  type="button"
                  onClick={() => handleOpenInVSCode(editorFile.path)}
                  className="px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Abrir no VS Code"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">VS Code</span>
                </button>

                {/* Copiar Conteúdo */}
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(editorContent);
                    showNotification('Conteúdo copiado para a área de transferência');
                  }}
                  className="px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar Código"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copiar</span>
                </button>

                {/* Salvar (Ctrl+S) */}
                <button
                  type="button"
                  onClick={handleSaveEditorFile}
                  disabled={editorSaving || !editorDirty}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editorSaving ? 'Salvando...' : 'Salvar (Ctrl+S)'}</span>
                </button>

                {/* Fechar */}
                <button
                  type="button"
                  onClick={() => setEditorFile(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer ml-1"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corpo do Editor de Texto */}
            <div className="flex-1 relative overflow-hidden bg-[#0d1117]">
              {editorLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-xs">Lendo arquivo...</span>
                </div>
              ) : (
                <textarea
                  value={editorContent}
                  onChange={(e) => {
                    setEditorContent(e.target.value);
                    setEditorDirty(true);
                  }}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                      e.preventDefault();
                      handleSaveEditorFile();
                    }
                  }}
                  spellCheck={false}
                  className="w-full h-full p-4 font-mono text-xs text-slate-200 bg-transparent resize-none focus:outline-hidden leading-relaxed selection:bg-blue-500/30"
                  placeholder="Arquivo vazio..."
                />
              )}
            </div>

            {/* Rodapé do Editor */}
            <div className="px-4 py-2 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between text-xs text-slate-400 font-mono">
              <div>
                <span>{editorContent.split('\n').length} linhas</span> • <span>{editorContent.length} caracteres</span>
              </div>
              <div className="text-slate-500">
                UTF-8 • {editorDirty ? 'Modificado' : 'Salvo'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Criar Arquivo / Pasta */}
      {createModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="text-white text-sm font-bold flex items-center gap-2">
              {createModal.type === 'folder' ? (
                <FolderPlus className="w-4 h-4 text-amber-400" />
              ) : (
                <File className="w-4 h-4 text-blue-400" />
              )}
              <span>Criar Nova {createModal.type === 'folder' ? 'Pasta' : 'Arquivo'}</span>
            </h3>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Nome do {createModal.type === 'folder' ? 'diretório' : 'arquivo'}</label>
              <input
                type="text"
                autoFocus
                placeholder={createModal.type === 'folder' ? 'meu-diretorio' : 'script.sh'}
                value={createModal.name}
                onChange={(e) => setCreateModal(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmCreate();
                  if (e.key === 'Escape') setCreateModal({ open: false, type: 'file', name: '' });
                }}
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateModal({ open: false, type: 'file', name: '' })}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#21262d] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={!createModal.name.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Renomear */}
      {renameModal.open && renameModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="text-white text-sm font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-amber-400" />
              <span>Renomear {renameModal.item.isDirectory ? 'Pasta' : 'Arquivo'}</span>
            </h3>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Novo Nome</label>
              <input
                type="text"
                autoFocus
                value={renameModal.newName}
                onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                  if (e.key === 'Escape') setRenameModal({ open: false, item: null, newName: '' });
                }}
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameModal({ open: false, item: null, newName: '' })}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#21262d] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                disabled={!renameModal.newName.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Exclusão */}
      {deleteModal.open && deleteModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161b22] border border-red-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="text-red-400 text-sm font-bold flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Confirmar Exclusão</span>
            </h3>

            <p className="text-xs text-slate-300">
              Tem certeza que deseja excluir permanentemente o item:
              <br />
              <strong className="text-white font-mono block mt-1 p-2 bg-[#0d1117] rounded-lg border border-[#30363d] break-all">
                {deleteModal.item.path}
              </strong>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, item: null })}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#21262d] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
              >
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
