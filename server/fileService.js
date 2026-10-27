import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico', 'svgz',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar', 'iso',
  'exe', 'bin', 'so', 'dylib', 'dll', 'class',
  'mp3', 'wav', 'ogg', 'flac', 'aac',
  'mp4', 'mkv', 'avi', 'mov', 'webm',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'sqlite', 'db', 'wasm'
]);

// Formatar modo numérico em string unix rwxr-xr-x
export function formatPermissions(mode) {
  if (typeof mode !== 'number') return '---------';
  const isDir = (mode & 0o40000) !== 0;
  const isSymlink = (mode & 0o120000) === 0o120000;
  const typeChar = isDir ? 'd' : (isSymlink ? 'l' : '-');

  const chars = [
    mode & 0o400 ? 'r' : '-',
    mode & 0o200 ? 'w' : '-',
    mode & 0o100 ? 'x' : '-',
    mode & 0o040 ? 'r' : '-',
    mode & 0o020 ? 'w' : '-',
    mode & 0o010 ? 'x' : '-',
    mode & 0o004 ? 'r' : '-',
    mode & 0o002 ? 'w' : '-',
    mode & 0o001 ? 'x' : '-'
  ];

  return typeChar + chars.join('');
}

// Formatar bytes em formato legível (KB, MB, GB)
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes)) return '-';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Extrair breadcrumbs navegáveis a partir de um caminho absoluto
export function getBreadcrumbs(dirPath) {
  const normalized = path.resolve(dirPath);
  const parts = normalized.split(path.sep).filter(Boolean);
  
  const breadcrumbs = [
    { label: 'Raiz (/)', path: path.sep }
  ];

  let currentAcc = '';
  for (const part of parts) {
    currentAcc += path.sep + part;
    breadcrumbs.push({
      label: part,
      path: currentAcc
    });
  }

  return breadcrumbs;
}

// Listar diretório local com metadados completos
export async function listDirectory(dirPath = '', showHidden = false) {
  const homeDir = process.env.HOME || os.homedir();
  const targetDir = dirPath ? path.resolve(dirPath) : homeDir;

  let dirStats;
  try {
    dirStats = await fs.promises.stat(targetDir);
  } catch (err) {
    return {
      error: `Diretório não encontrado: ${err.message}`,
      code: err.code || 'ENOENT',
      currentPath: targetDir,
      parentPath: path.dirname(targetDir),
      homeDir,
      items: []
    };
  }

  if (!dirStats.isDirectory()) {
    return {
      error: 'O caminho informado não é um diretório',
      code: 'ENOTDIR',
      currentPath: targetDir,
      parentPath: path.dirname(targetDir),
      homeDir,
      items: []
    };
  }

  let rawEntries;
  try {
    rawEntries = await fs.promises.readdir(targetDir, { withFileTypes: true });
  } catch (err) {
    return {
      error: `Permissão negada ou erro ao ler diretório: ${err.message}`,
      code: err.code || 'EACCES',
      currentPath: targetDir,
      parentPath: path.dirname(targetDir),
      homeDir,
      items: []
    };
  }

  const items = [];

  for (const entry of rawEntries) {
    // Ocultar arquivos que iniciam com '.' caso showHidden seja falso
    if (!showHidden && entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(targetDir, entry.name);
    let itemStat = null;
    let isSymlink = entry.isSymbolicLink();

    try {
      if (isSymlink) {
        itemStat = await fs.promises.lstat(fullPath);
      } else {
        itemStat = await fs.promises.stat(fullPath);
      }
    } catch {
      // Caso arquivo esteja corrompido ou link quebrado
      try {
        itemStat = await fs.promises.lstat(fullPath);
      } catch {
        itemStat = null;
      }
    }

    const isDirectory = entry.isDirectory() || (itemStat && itemStat.isDirectory());
    const isFile = entry.isFile() || (itemStat && itemStat.isFile());
    const ext = path.extname(entry.name).toLowerCase().replace('.', '');
    const size = itemStat ? itemStat.size : 0;
    const mtime = itemStat ? itemStat.mtime.toISOString() : null;
    const permissions = itemStat ? formatPermissions(itemStat.mode) : '---------';

    items.push({
      name: entry.name,
      path: fullPath,
      isDirectory: Boolean(isDirectory),
      isFile: Boolean(isFile),
      isSymlink: Boolean(isSymlink),
      size,
      sizeFormatted: isDirectory ? '-' : formatBytes(size),
      mtime,
      permissions,
      extension: ext,
      isBinary: BINARY_EXTENSIONS.has(ext)
    });
  }

  // Ordenar: Diretórios primeiro, depois arquivos alfabeticamente
  items.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  const parentPath = targetDir === path.sep ? null : path.dirname(targetDir);

  return {
    currentPath: targetDir,
    parentPath,
    homeDir,
    breadcrumbs: getBreadcrumbs(targetDir),
    totalItems: items.length,
    foldersCount: items.filter(i => i.isDirectory).length,
    filesCount: items.filter(i => !i.isDirectory).length,
    items
  };
}

// Ler conteúdo de arquivo com verificação de segurança de tamanho
export async function readFileContent(filePath, maxSizeBytes = 5 * 1024 * 1024) {
  const cleanPath = path.resolve(filePath);
  const stats = await fs.promises.stat(cleanPath);

  if (stats.isDirectory()) {
    throw new Error('Caminho é um diretório, não um arquivo');
  }

  const ext = path.extname(cleanPath).toLowerCase().replace('.', '');
  if (BINARY_EXTENSIONS.has(ext)) {
    return {
      path: cleanPath,
      name: path.basename(cleanPath),
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      mtime: stats.mtime.toISOString(),
      isBinary: true,
      content: null
    };
  }

  if (stats.size > maxSizeBytes) {
    throw new Error(`Arquivo excede o limite de ${formatBytes(maxSizeBytes)} para leitura no editor`);
  }

  const content = await fs.promises.readFile(cleanPath, 'utf-8');

  // Checar se contém bytes nulos (indicativo de arquivo binário)
  if (content.slice(0, 4096).includes('\0')) {
    return {
      path: cleanPath,
      name: path.basename(cleanPath),
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      mtime: stats.mtime.toISOString(),
      isBinary: true,
      content: null
    };
  }

  return {
    path: cleanPath,
    name: path.basename(cleanPath),
    size: stats.size,
    sizeFormatted: formatBytes(stats.size),
    mtime: stats.mtime.toISOString(),
    isBinary: false,
    content
  };
}

// Salvar conteúdo de arquivo
export async function writeFileContent(filePath, content) {
  const cleanPath = path.resolve(filePath);
  
  // Garantir diretório pai
  const parentDir = path.dirname(cleanPath);
  await fs.promises.mkdir(parentDir, { recursive: true });

  await fs.promises.writeFile(cleanPath, content, 'utf-8');
  const stats = await fs.promises.stat(cleanPath);

  return {
    success: true,
    path: cleanPath,
    name: path.basename(cleanPath),
    size: stats.size,
    sizeFormatted: formatBytes(stats.size),
    mtime: stats.mtime.toISOString()
  };
}

// Criar diretório
export async function createDirectory(dirPath) {
  const cleanPath = path.resolve(dirPath);
  await fs.promises.mkdir(cleanPath, { recursive: true });
  return { success: true, path: cleanPath };
}

// Criar arquivo vazio
export async function createFile(filePath, initialContent = '') {
  const cleanPath = path.resolve(filePath);
  const parentDir = path.dirname(cleanPath);
  await fs.promises.mkdir(parentDir, { recursive: true });
  await fs.promises.writeFile(cleanPath, initialContent, { flag: 'wx' });
  return { success: true, path: cleanPath };
}

// Excluir arquivo ou diretório com proteção para caminhos do sistema
const PROTECTED_PATHS = new Set([
  '/', '/home', '/root', '/etc', '/usr', '/bin', '/sbin', 
  '/var', '/lib', '/sys', '/proc', '/dev', '/boot'
]);

export async function deletePath(targetPath) {
  const cleanPath = path.resolve(targetPath);
  
  if (PROTECTED_PATHS.has(cleanPath)) {
    throw new Error(`Operação bloqueada: o caminho protegido do sistema '${cleanPath}' não pode ser excluído`);
  }

  const userHome = process.env.HOME || os.homedir();
  if (cleanPath === userHome) {
    throw new Error('Operação bloqueada: o diretório raiz do usuário não pode ser excluído');
  }

  await fs.promises.rm(cleanPath, { recursive: true, force: true });
  return { success: true, path: cleanPath };
}

// Renomear ou mover arquivo / diretório
export async function renamePath(oldPath, newPath) {
  const cleanOld = path.resolve(oldPath);
  const cleanNew = path.resolve(newPath);

  if (PROTECTED_PATHS.has(cleanOld) || PROTECTED_PATHS.has(cleanNew)) {
    throw new Error('Operação bloqueada em caminhos protegidos do sistema');
  }

  await fs.promises.rename(cleanOld, cleanNew);
  return { success: true, oldPath: cleanOld, newPath: cleanNew };
}

// Listar arquivos remotos via SSH
export async function listRemoteDirectory(host, remotePath = '~', showHidden = false) {
  if (!host || host.type !== 'ssh') {
    return listDirectory(remotePath, showHidden);
  }

  const port = host.port || 22;
  const user = host.user || 'root';
  const address = host.address;

  const sshArgs = [
    '-p', String(port),
    '-o', 'BatchMode=yes',
    '-o', 'ConnectTimeout=5',
    '-o', 'StrictHostKeyChecking=accept-new'
  ];

  if (host.keyPath) {
    sshArgs.push('-i', path.resolve(host.keyPath));
  }

  const targetPath = remotePath || '~';
  const hiddenFlag = showHidden ? '-a' : '';
  const command = `ls -la --time-style=full-iso ${targetPath}`;

  sshArgs.push(`${user}@${address}`, command);

  return new Promise((resolve) => {
    const proc = spawn('ssh', sshArgs);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        return resolve({
          error: stderr || `Falha na conexão SSH (código ${code})`,
          code: 'SSH_ERROR',
          currentPath: targetPath,
          items: []
        });
      }

      const lines = stdout.split('\n').filter(Boolean);
      const items = [];

      for (const line of lines) {
        if (line.startsWith('total ') || line.trim() === '') continue;
        const parts = line.trim().split(/\s+/);
        if (parts.length < 9) continue;

        const permissions = parts[0];
        const isDir = permissions.startsWith('d');
        const isSymlink = permissions.startsWith('l');
        const size = parseInt(parts[4], 10) || 0;
        const dateStr = `${parts[5]}T${parts[6]}`;
        const name = parts.slice(8).join(' ');

        if (name === '.' || name === '..') continue;
        if (!showHidden && name.startsWith('.')) continue;

        const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';

        items.push({
          name,
          path: targetPath.endsWith('/') ? `${targetPath}${name}` : `${targetPath}/${name}`,
          isDirectory: isDir,
          isFile: !isDir,
          isSymlink,
          size,
          sizeFormatted: isDir ? '-' : formatBytes(size),
          mtime: dateStr,
          permissions,
          extension: ext,
          isBinary: BINARY_EXTENSIONS.has(ext)
        });
      }

      items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      resolve({
        currentPath: targetPath,
        parentPath: targetPath.includes('/') ? targetPath.replace(/\/[^/]+$/, '') || '/' : null,
        items,
        totalItems: items.length,
        foldersCount: items.filter(i => i.isDirectory).length,
        filesCount: items.filter(i => !i.isDirectory).length,
        isRemote: true,
        hostId: host.id,
        hostLabel: host.label
      });
    });

    proc.on('error', (err) => {
      resolve({
        error: `Erro ao iniciar cliente SSH: ${err.message}`,
        code: 'SPAWN_ERROR',
        currentPath: targetPath,
        items: []
      });
    });
  });
}
