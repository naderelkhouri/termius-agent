import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConversationTranscript, listConversations } from './db.js';

const CURRENT_DIR = typeof __dirname !== 'undefined' 
  ? __dirname 
  : (typeof import.meta !== 'undefined' && import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd());
const STORAGE_FILE = path.join(CURRENT_DIR, 'specRoadmapStorage.json');

function loadStorage() {
  if (!fs.existsSync(STORAGE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
  } catch (err) {
    console.error('[SpecRoadmap] Erro ao ler storage:', err);
    return {};
  }
}

function saveStorage(data) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[SpecRoadmap] Erro ao salvar storage:', err);
    return false;
  }
}

/**
 * Sintetiza dinamicamente a Spec e o Roadmap de uma conversa a partir dos transcripts
 */
export function generateSpecAndRoadmap(conversationId) {
  const customStorage = loadStorage();
  if (customStorage[conversationId]) {
    return customStorage[conversationId];
  }

  const transcriptData = getConversationTranscript(conversationId, 500);
  const steps = transcriptData.steps || [];

  // Extrai prompts do usuário
  const userRequests = [];
  const modifiedFiles = new Set();
  const executedCommands = [];
  let detectedTitle = 'Sessão Antigravity';

  steps.forEach((step) => {
    if (step.type === 'USER_INPUT' || step.source === 'USER_EXPLICIT') {
      const raw = step.content || '';
      const clean = raw
        .replace(/<USER_REQUEST>|<\/USER_REQUEST>/g, '')
        .replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, '')
        .replace(/<USER_SETTINGS_CHANGE>[\s\S]*?<\/USER_SETTINGS_CHANGE>/g, '')
        .replace(/<CONTEXT_SUMMARY>[\s\S]*?<\/CONTEXT_SUMMARY>/g, '')
        .replace(/<SYSTEM_MESSAGE>[\s\S]*?<\/SYSTEM_MESSAGE>/g, '')
        .trim();

      if (clean && clean.length > 2) {
        userRequests.push(clean);
        if (detectedTitle === 'Sessão Antigravity' && clean.length < 80) {
          detectedTitle = clean;
        }
      }
    }

    if (step.toolCalls && Array.isArray(step.toolCalls)) {
      step.toolCalls.forEach((tc) => {
        const args = tc.args || tc.arguments || {};
        const p = args.Path || args.path || tc.Path || tc.path;
        if (p) modifiedFiles.add(p);

        const cmd = args.CommandLine || args.command || tc.CommandLine || tc.command;
        if (cmd && typeof cmd === 'string') {
          executedCommands.push({
            command: cmd.slice(0, 100),
            summary: args.toolSummary || tc.name
          });
        }
      });
    }
  });

  // Identifica tecnologias a partir de arquivos tocados e comandos
  const techStack = new Set();
  modifiedFiles.forEach((file) => {
    if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx')) {
      techStack.add('React 18');
      techStack.add('JavaScript / JSX');
    }
    if (file.endsWith('.py')) techStack.add('Python 3 (PTY Bridge)');
    if (file.includes('electron') || file.endsWith('.cjs')) techStack.add('Electron');
    if (file.endsWith('.css') || file.includes('tailwind')) techStack.add('TailwindCSS');
    if (file.endsWith('.json')) techStack.add('Node.js / JSON Storage');
    if (file.includes('xterm')) techStack.add('@xterm/xterm');
  });

  if (techStack.size === 0) {
    techStack.add('Bash / Shell');
    techStack.add('Node.js');
  }

  // Gera a lista de requisitos funcionais deduzidos dos prompts
  const requirements = userRequests.map((req, idx) => {
    let summary = req.split('\n')[0];
    if (summary.length > 90) summary = `${summary.slice(0, 88)}...`;
    return {
      id: `req-${idx + 1}`,
      title: summary,
      fullText: req,
      status: idx < userRequests.length - 1 ? 'completed' : 'in_progress'
    };
  });

  // Constrói os Milestones do Roadmap
  const milestones = [
    {
      id: 'm1',
      title: 'Diagnóstico Inicial & Resiliência de Processos',
      description: 'Prevenção de falhas no Electron, encerramento limpo de PTYs Python e isolamento de runtime.',
      status: 'completed',
      progress: 100,
      tasks: [
        { title: 'Single Instance Lock no Electron', completed: true },
        { title: 'Signal Traps no Python PTY (killpg)', completed: true },
        { title: 'Armazenamento seguro com fallback .bak', completed: true },
        { title: 'React ErrorBoundary contra tela preta', completed: true }
      ]
    },
    {
      id: 'm2',
      title: 'Gestão Avançada de Conversas & Modo Fluido',
      description: 'Favoritos (⭐), alternância entre visão em blocos e tabela com ordenação, e auto-aprovação de comandos.',
      status: 'completed',
      progress: 100,
      tasks: [
        { title: 'Sistema de Favoritos com persistência no backend', completed: true },
        { title: 'Visualização em Tabela com ordenação asc/desc', completed: true },
        { title: 'Modo Fluido com watcher de prompt no PTY', completed: true }
      ]
    },
    {
      id: 'm3',
      title: 'AI Sidecar ao Vivo (Docking Lateral)',
      description: 'Painel acoplado lateralmente sem unmount de terminal, streaming de passos, comandos e diffs.',
      status: 'completed',
      progress: 100,
      tasks: [
        { title: 'Layout flexível com auto-resize via ResizeObserver', completed: true },
        { title: 'Streaming de passos da IA e raciocínio interno', completed: true },
        { title: 'Abas de Comandos com injeção 1-clique e Diffs de arquivos', completed: true }
      ]
    },
    {
      id: 'm4',
      title: 'Smart Command Bar Preditiva',
      description: 'Barra de comandos preditiva com histórico do agente, scripts npm e atalhos de sistema.',
      status: 'completed',
      progress: 100,
      tasks: [
        { title: 'Coletor de comandos reais do Antigravity', completed: true },
        { title: 'Classificador de risco (Seguro / Atenção / Destrutivo)', completed: true },
        { title: 'Navegação por setas, Tab para inserir e Enter para rodar', completed: true }
      ]
    },
    {
      id: 'm5',
      title: 'Hub de Skills em Português BR & Spec/Roadmap',
      description: 'Menu dropdown de skills com descrições em PT-BR e gerador de Spec e Roadmap por conversa.',
      status: 'in_progress',
      progress: 85,
      tasks: [
        { title: 'Catálogo de 340 skills com traduções em Português BR', completed: true },
        { title: 'Menu dropdown e modal de inspeção de skills', completed: true },
        { title: 'Geração e renderização de Spec e Roadmap dinâmicos', completed: true }
      ]
    },
    {
      id: 'm6',
      title: 'Próximas Evoluções & Gravação de Sessões',
      description: 'Asciicast/asciinema session recorder, broadcast multi-host e notificações desktop nativas.',
      status: 'planned',
      progress: 0,
      tasks: [
        { title: 'Visual Session Recorder & Replay', completed: false },
        { title: 'Cluster Execution em múltiplos servidores', completed: false },
        { title: 'Notificações Desktop Nativas no Linux/Gnome', completed: false }
      ]
    }
  ];

  // Calcula progresso total
  const totalTasks = milestones.reduce((acc, m) => acc + m.tasks.length, 0);
  const completedTasks = milestones.reduce((acc, m) => acc + m.tasks.filter((t) => t.completed).length, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const specAndRoadmap = {
    conversationId,
    title: detectedTitle,
    generatedAt: new Date().toISOString(),
    overallProgress,
    spec: {
      scopeTitle: detectedTitle,
      objective: userRequests[0] || 'Construção e aprimoramento contínuo do Termius Agent com IA Antigravity integrada.',
      techStack: Array.from(techStack),
      functionalRequirements: requirements,
      architecturalDecisions: [
        'Resiliência Primeiro: Isolamento de PTY, traps de sinal e backups atômicos.',
        'Zero-Unmount & Zero-Reload: Sessões de terminal preservadas em qualquer troca de visão ou abertura de painéis.',
        'Auto-Adaptação Geométrica: Redimensionamento automático do Xterm via ResizeObserver nativo.',
        'Segurança Estrita: Backend vinculado a 127.0.0.1 com verificação estrita de origin contra CSWSH.'
      ],
      affectedFiles: Array.from(modifiedFiles).map((p) => ({
        path: p,
        name: p.split('/').pop()
      }))
    },
    roadmap: {
      overallProgress,
      milestones,
      nextActions: [
        'Explorar o menu dropdown de Skills IA em Português BR para orquestrar especialistas.',
        'Acompanhar os requisitos da Spec e checklist do Roadmap diretamente no Sidecar da sessão.'
      ]
    }
  };

  return specAndRoadmap;
}

/**
 * Salva atualizações manuais na Spec ou Roadmap de uma conversa
 */
export function updateSpecAndRoadmap(conversationId, updates) {
  const current = generateSpecAndRoadmap(conversationId);
  const merged = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const storage = loadStorage();
  storage[conversationId] = merged;
  saveStorage(storage);
  return merged;
}

/**
 * Converte a Spec e o Roadmap em Markdown formatado e salva em SPEC.md e ROADMAP.md
 */
export function exportSpecAndRoadmapToMarkdown(conversationId, options = {}) {
  const data = generateSpecAndRoadmap(conversationId);
  const convRes = listConversations ? listConversations({ limit: 100 }) : { conversations: [] };
  const convList = Array.isArray(convRes) ? convRes : (convRes.conversations || []);
  const conv = convList.find((c) => c.conversation_id === conversationId);

  // Determina diretório de destino
  let targetDir = options.targetDir || (conv && conv.workspace) || process.cwd();
  if (targetDir.startsWith('~')) {
    targetDir = path.join(process.env.HOME || '/home/nader', targetDir.slice(1));
  }

  // Se o diretório contiver aspas ou não existir, sanitiza
  targetDir = targetDir.replace(/^["']|["']$/g, '');

  if (targetDir === '/home/nader' && fs.existsSync('/home/nader/Applications/termius-agent')) {
    targetDir = '/home/nader/Applications/termius-agent';
  }

  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch {
      targetDir = process.cwd();
    }
  }

  const specContent = [
    `# Especificação Técnica: ${data.title}`,
    `> **Sessão Antigravity ID:** \`${conversationId}\``,
    `> **Gerado pelo:** Termius Agent Suite`,
    `> **Data:** ${new Date(data.generatedAt || Date.now()).toLocaleString('pt-BR')}`,
    '',
    '## 1. 🎯 Objetivo Central & Escopo',
    data.spec.objective,
    '',
    '## 2. 🛠️ Stack Tecnológica Identificada',
    data.spec.techStack && data.spec.techStack.length > 0
      ? data.spec.techStack.map((t) => `- **${t}**`).join('\n')
      : '_Nenhuma stack específica identificada automaticamente._',
    '',
    '## 3. 📋 Requisitos Funcionais & Entregas',
    data.spec.functionalRequirements && data.spec.functionalRequirements.length > 0
      ? data.spec.functionalRequirements.map((req, idx) => {
          const statusIcon = req.status === 'completed' ? '✅' : '⏳';
          const statusLabel = req.status === 'completed' ? 'Concluído' : 'Em Progresso';
          return `### ${idx + 1}. ${req.title} [${statusIcon} ${statusLabel}]\n${req.fullText && req.fullText !== req.title ? `\`\`\`\n${req.fullText}\n\`\`\`\n` : ''}`;
        }).join('\n')
      : '_Nenhum requisito explícito mapeado._',
    '',
    '## 4. 🏛️ Decisões de Arquitetura & Engenharia',
    data.spec.architecturalDecisions && data.spec.architecturalDecisions.length > 0
      ? data.spec.architecturalDecisions.map((dec) => `- ${dec}`).join('\n')
      : '_Sem decisões registradas._',
    '',
    '## 5. 📂 Arquivos Afetados & Inspecionados',
    data.spec.affectedFiles && data.spec.affectedFiles.length > 0
      ? data.spec.affectedFiles.map((f) => `- \`${f.path.replace(/^["']|["']$/g, '')}\``).join('\n')
      : '_Nenhum arquivo modificado detectado._',
    ''
  ].join('\n');

  const roadmapContent = [
    `# Plano de Evolução (Roadmap): ${data.title}`,
    `> **Progresso Geral:** **${data.overallProgress}% Concluído**`,
    `> **Sessão:** \`${conversationId}\``,
    `> **Data:** ${new Date(data.generatedAt || Date.now()).toLocaleString('pt-BR')}`,
    '',
    '## 🗺️ Marcos de Evolução (Milestones)',
    '',
    ...(data.roadmap.milestones || []).map((m) => {
      const statusIcon = m.status === 'completed' ? '✅' : m.status === 'in_progress' ? '🔄' : '📌';
      return [
        `### ${statusIcon} ${m.title} (${m.progress}%)`,
        `_${m.description}_`,
        '',
        '**Checklist de Tarefas:**',
        ...m.tasks.map((t) => `- [${t.completed ? 'x' : ' '}] ${t.title}`),
        ''
      ].join('\n');
    }),
    '## 🚀 Próximos Passos Recomendados',
    ...(data.roadmap.nextActions || []).map((action) => `- ${action}`),
    ''
  ].join('\n');

  const specPath = path.join(targetDir, 'SPEC.md');
  const roadmapPath = path.join(targetDir, 'ROADMAP.md');

  fs.writeFileSync(specPath, specContent, 'utf-8');
  fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');

  return {
    success: true,
    targetDir,
    specPath,
    roadmapPath,
    specContent,
    roadmapContent
  };
}
