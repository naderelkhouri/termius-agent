import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HOME_DIR = process.env.HOME || os.homedir();
const BRAIN_PATH = path.join(HOME_DIR, '.gemini/antigravity-cli/brain');

// Cache em memória para comandos do Antigravity
let cachedAgentCommands = [];
let lastAgentCacheTime = 0;
const CACHE_TTL_MS = 25000; // 25s

function cleanCommandString(raw) {
  if (!raw) return '';
  let str = String(raw).trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    try {
      const parsed = JSON.parse(str);
      if (typeof parsed === 'string') str = parsed.trim();
    } catch {
      str = str.slice(1, -1).trim();
    }
  }
  return str;
}

/**
 * Classifica o nível de risco de um comando bash
 */
export function classifyRisk(cmd = '') {
  const str = cmd.toLowerCase().trim();
  if (
    str.includes('rm -rf') ||
    str.includes('rm -r /') ||
    str.includes('git reset --hard') ||
    str.includes('git clean -fd') ||
    str.includes('git restore .') ||
    str.includes('prune -af') ||
    str.includes('drop database') ||
    str.includes('dd if=') ||
    str.includes('mkfs')
  ) {
    return 'destructive';
  }
  if (
    str.startsWith('kill ') ||
    str.startsWith('pkill ') ||
    str.startsWith('fuser -k') ||
    str.includes('systemctl restart') ||
    str.includes('systemctl stop') ||
    str.includes('docker stop') ||
    str.includes('docker rm') ||
    str.includes('git checkout -b') ||
    str.includes('git push --force') ||
    str.includes('npm install -g')
  ) {
    return 'caution';
  }
  return 'safe';
}

/**
 * Carrega comandos executados recentemente pelos agentes Antigravity
 */
export function harvestAgentCommands(maxSessions = 15, maxCommands = 60) {
  const now = Date.now();
  if (cachedAgentCommands.length > 0 && now - lastAgentCacheTime < CACHE_TTL_MS) {
    return cachedAgentCommands;
  }

  if (!fs.existsSync(BRAIN_PATH)) {
    return [];
  }

  const collected = [];
  const seenCommands = new Set();

  try {
    const entries = fs.readdirSync(BRAIN_PATH, { withFileTypes: true });
    // Ordena diretórios mais recentes pelo ctime/mtime
    const sessionDirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => {
        const full = path.join(BRAIN_PATH, e.name);
        try {
          return { name: e.name, time: fs.statSync(full).mtimeMs };
        } catch {
          return { name: e.name, time: 0 };
        }
      })
      .sort((a, b) => b.time - a.time)
      .slice(0, maxSessions);

    for (const s of sessionDirs) {
      const transcriptFile = path.join(BRAIN_PATH, s.name, '.system_generated/logs/transcript.jsonl');
      if (!fs.existsSync(transcriptFile)) continue;

      try {
        const stats = fs.statSync(transcriptFile);
        let content = '';
        if (stats.size > 2 * 1024 * 1024) {
          const buffer = Buffer.alloc(2 * 1024 * 1024);
          const fd = fs.openSync(transcriptFile, 'r');
          fs.readSync(fd, buffer, 0, buffer.length, stats.size - buffer.length);
          fs.closeSync(fd);
          content = buffer.toString('utf-8');
          const firstNl = content.indexOf('\n');
          if (firstNl !== -1) content = content.slice(firstNl + 1);
        } else {
          content = fs.readFileSync(transcriptFile, 'utf-8');
        }

        const lines = content.trim().split('\n');
        // Varre do mais recente para o mais antigo
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          if (!line.trim()) continue;
          try {
            const step = JSON.parse(line);
            if (!step.tool_calls || !Array.isArray(step.tool_calls)) continue;

            for (const tc of step.tool_calls) {
              if (tc.name === 'run_command' && tc.args) {
                let cmd = cleanCommandString(tc.args.CommandLine || tc.args.command || '');
                // Ignora comandos muito longos (> 250 chars) ou vazios
                if (!cmd || cmd.length > 250 || cmd.includes('\n')) continue;

                if (!seenCommands.has(cmd)) {
                  seenCommands.add(cmd);
                  const summary = cleanCommandString(tc.args.toolSummary || 'Comando executado pelo Antigravity');
                  collected.push({
                    id: `agent-cmd-${collected.length}`,
                    command: cmd,
                    description: summary,
                    source: 'antigravity',
                    sourceLabel: '🤖 Antigravity AI',
                    category: detectCategory(cmd),
                    risk: classifyRisk(cmd),
                    timestamp: step.created_at || null
                  });
                  if (collected.length >= maxCommands) break;
                }
              }
            }
          } catch {}
          if (collected.length >= maxCommands) break;
        }
      } catch (err) {
        // Ignora erros ao ler sessão específica
      }
      if (collected.length >= maxCommands) break;
    }

    cachedAgentCommands = collected;
    lastAgentCacheTime = now;
    return collected;
  } catch (err) {
    console.error('[CommandSuggestions] Erro ao carregar comandos de agentes:', err);
    return cachedAgentCommands;
  }
}

/**
 * Detecta comandos contextuais da pasta atual (package.json, git, docker, etc.)
 */
export function harvestContextualCommands(cwd = '/home/nader') {
  const list = [];
  if (!cwd || !fs.existsSync(cwd)) return list;

  // 1. package.json scripts
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.scripts && typeof pkg.scripts === 'object') {
        for (const [scriptName, scriptCmd] of Object.entries(pkg.scripts)) {
          list.push({
            id: `pkg-${scriptName}`,
            command: `npm run ${scriptName}`,
            description: `Script npm "${scriptName}": ${scriptCmd}`,
            source: 'package_json',
            sourceLabel: '📦 package.json',
            category: 'Node/NPM',
            risk: scriptName.includes('clean') || scriptName.includes('drop') ? 'caution' : 'safe'
          });
        }
      }
    } catch {}
  }

  // 2. Git context
  const gitDir = path.join(cwd, '.git');
  if (fs.existsSync(gitDir)) {
    list.push(
      {
        id: 'git-status',
        command: 'git status -sb',
        description: 'Exibe status resumido do repositório Git e branch atual',
        source: 'git',
        sourceLabel: '⚡ Git',
        category: 'Git',
        risk: 'safe'
      },
      {
        id: 'git-diff',
        command: 'git diff --stat',
        description: 'Estatísticas resumidas de arquivos modificados',
        source: 'git',
        sourceLabel: '⚡ Git',
        category: 'Git',
        risk: 'safe'
      },
      {
        id: 'git-log',
        command: 'git log --oneline --graph --decorate -n 12',
        description: 'Visualiza os últimos 12 commits em formato compacto e gráfico',
        source: 'git',
        sourceLabel: '⚡ Git',
        category: 'Git',
        risk: 'safe'
      },
      {
        id: 'git-pull',
        command: 'git pull --rebase',
        description: 'Sincroniza commits remotos aplicando rebase local limpo',
        source: 'git',
        sourceLabel: '⚡ Git',
        category: 'Git',
        risk: 'caution'
      }
    );
  }

  // 3. Docker Compose context
  if (fs.existsSync(path.join(cwd, 'docker-compose.yml')) || fs.existsSync(path.join(cwd, 'compose.yaml'))) {
    list.push(
      {
        id: 'docker-up',
        command: 'docker compose up -d',
        description: 'Inicia os serviços definidos no docker-compose em background',
        source: 'docker',
        sourceLabel: '🐳 Docker',
        category: 'Docker',
        risk: 'caution'
      },
      {
        id: 'docker-ps',
        command: 'docker compose ps',
        description: 'Lista status dos containers deste projeto compose',
        source: 'docker',
        sourceLabel: '🐳 Docker',
        category: 'Docker',
        risk: 'safe'
      },
      {
        id: 'docker-logs',
        command: 'docker compose logs -f --tail=100',
        description: 'Acompanha em tempo real os últimos 100 logs dos containers',
        source: 'docker',
        sourceLabel: '🐳 Docker',
        category: 'Docker',
        risk: 'safe'
      }
    );
  }

  return list;
}

/**
 * Padrões gerais de sistema e utilitários DevOps
 */
export const SYSTEM_DEVOPS_COMMANDS = [
  {
    id: 'sys-ports',
    command: 'ss -tulpn | grep LISTEN',
    description: 'Lista todas as portas TCP/UDP abertas e em modo LISTEN com processos',
    source: 'system',
    sourceLabel: '🔧 Sistema',
    category: 'Rede',
    risk: 'safe'
  },
  {
    id: 'sys-mem',
    command: 'free -h --wide',
    description: 'Exibe consumo detalhado de memória RAM e swap com buffers/cache',
    source: 'system',
    sourceLabel: '🔧 Sistema',
    category: 'Sistema',
    risk: 'safe'
  },
  {
    id: 'sys-disk',
    command: 'df -h -x tmpfs -x devtmpfs',
    description: 'Exibe espaço livre e ocupado nas partições de disco reais',
    source: 'system',
    sourceLabel: '🔧 Sistema',
    category: 'Sistema',
    risk: 'safe'
  },
  {
    id: 'sys-top-dirs',
    command: 'du -ah --max-depth=1 2>/dev/null | sort -hr | head -n 12',
    description: 'Identifica os 12 maiores arquivos ou pastas dentro do diretório atual',
    source: 'system',
    sourceLabel: '🔧 Sistema',
    category: 'Sistema',
    risk: 'safe'
  },
  {
    id: 'sys-ip',
    command: 'ip -c a',
    description: 'Mostra interfaces de rede e endereços IP locais com destaque em cores',
    source: 'system',
    sourceLabel: '🔧 Sistema',
    category: 'Rede',
    risk: 'safe'
  },
  {
    id: 'sys-procs',
    command: 'ps aux --sort=-%mem | head -n 15',
    description: 'Exibe os 15 processos que mais consom memória RAM no momento',
    source: 'system',
    sourceLabel: '🔧 Sistema',
    category: 'Sistema',
    risk: 'safe'
  }
];

function detectCategory(cmd = '') {
  const c = cmd.toLowerCase();
  if (c.startsWith('git ') || c.includes('git ')) return 'Git';
  if (c.startsWith('npm ') || c.startsWith('node ') || c.startsWith('yarn ') || c.startsWith('bun ') || c.startsWith('pnpm ')) return 'Node/NPM';
  if (c.startsWith('docker ') || c.includes('docker-compose') || c.includes('docker compose')) return 'Docker';
  if (c.includes('ss ') || c.includes('netstat') || c.includes('curl ') || c.includes('ip ') || c.includes('ping ')) return 'Rede';
  if (c.startsWith('python') || c.startsWith('pip ')) return 'Python';
  return 'Sistema';
}

/**
 * Função principal que combina e filtra todas as sugestões
 */
export function getCommandSuggestions({
  query = '',
  cwd = '/home/nader',
  category = 'all',
  limit = 20,
  snippets = []
} = {}) {
  const agentCmds = harvestAgentCommands();
  const contextCmds = harvestContextualCommands(cwd);

  const snippetCmds = (snippets || []).map((s, idx) => ({
    id: `snippet-${s.id || idx}`,
    command: s.command || '',
    description: s.description || s.title || 'Snippet salvo',
    source: 'snippet',
    sourceLabel: '📋 Snippet',
    category: s.category || 'Snippet',
    risk: classifyRisk(s.command || '')
  }));

  // Ordem de precedência:
  // 1. Scripts específicos da pasta do projeto (package.json, git, docker)
  // 2. Comandos executados recentemente pelo Antigravity AI
  // 3. Snippets salvos pelo usuário
  // 4. Utilitários do sistema
  const allCandidates = [
    ...contextCmds,
    ...agentCmds,
    ...snippetCmds,
    ...SYSTEM_DEVOPS_COMMANDS
  ];

  // Deduplicação pelo texto do comando
  const seen = new Set();
  const uniqueCandidates = [];
  for (const item of allCandidates) {
    const trimmed = (item.command || '').trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    uniqueCandidates.push(item);
  }

  // Filtragem por categoria
  let filtered = uniqueCandidates;
  if (category && category !== 'all') {
    const catLower = category.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        (c.category && c.category.toLowerCase() === catLower) ||
        (c.source && c.source.toLowerCase() === catLower)
    );
  }

  // Filtragem por query de pesquisa
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    filtered = filtered
      .map((item) => {
        const cmdLower = item.command.toLowerCase();
        const descLower = item.description.toLowerCase();
        let score = 0;

        if (cmdLower === q) score += 100;
        else if (cmdLower.startsWith(q)) score += 60;
        else if (cmdLower.includes(q)) score += 30;

        if (descLower.startsWith(q)) score += 40;
        else if (descLower.includes(q)) score += 20;

        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  return filtered.slice(0, limit);
}
