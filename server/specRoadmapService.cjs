const fs = require('node:fs');
const path = require('node:path');
const { getConversationTranscript, listConversations } = require('./db.cjs');

const CURRENT_DIR = __dirname;
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
 * Detecta o diretório/projeto real vinculado à conversa
 */
function detectConversationWorkspace(conversationId, explicitWorkspace = null) {
  if (explicitWorkspace && explicitWorkspace !== '/home/nader' && fs.existsSync(explicitWorkspace)) {
    return explicitWorkspace;
  }

  // 1. Tenta listar das conversas cadastradas no SQLite
  try {
    const convRes = listConversations ? listConversations({ limit: 150 }) : null;
    const convList = Array.isArray(convRes) ? convRes : (convRes?.conversations || []);
    const found = convList.find((c) => c.conversation_id === conversationId);
    if (found?.workspace && found.workspace !== '/home/nader' && fs.existsSync(found.workspace)) {
      return found.workspace;
    }
  } catch {}

  // 2. Extrai caminhos tocados nos toolCalls do transcript
  try {
    const transcriptData = getConversationTranscript(conversationId, 200);
    const candidateDirs = new Map();

    (transcriptData?.steps || []).forEach((step) => {
      (step.toolCalls || []).forEach((tc) => {
        const args = tc.args || tc.arguments || {};
        const p = args.Path || args.path || args.CommandLine || args.command;
        if (p && typeof p === 'string') {
          const match = p.match(/\/home\/[a-zA-Z0-9_\-\.]+\/[a-zA-Z0-9_\-\.\/]+/);
          if (match) {
            let clean = match[0].replace(/['"]+/g, '');
            if (!clean.endsWith('/')) {
              clean = path.dirname(clean);
            }
            let curr = clean;
            for (let i = 0; i < 4; i++) {
              if (curr === '/home/nader' || curr === '/' || !curr) break;
              if (fs.existsSync(path.join(curr, 'SPEC.md')) || 
                  fs.existsSync(path.join(curr, 'spec.md')) ||
                  fs.existsSync(path.join(curr, 'package.json')) ||
                  fs.existsSync(path.join(curr, '.git'))) {
                candidateDirs.set(curr, (candidateDirs.get(curr) || 0) + 10);
                break;
              }
              candidateDirs.set(curr, (candidateDirs.get(curr) || 0) + 1);
              curr = path.dirname(curr);
            }
          }
        }
      });
    });

    if (candidateDirs.size > 0) {
      const sorted = Array.from(candidateDirs.entries()).sort((a, b) => b[1] - a[1]);
      for (const [dir] of sorted) {
        if (fs.existsSync(dir) && dir !== '/home/nader') {
          return dir;
        }
      }
    }
  } catch {}

  return explicitWorkspace || '/home/nader';
}

/**
 * Obtém a especificação e o roadmap REAIS do projeto da conversa
 */
function generateSpecAndRoadmap(conversationId, queryWorkspace = null) {
  const workspace = detectConversationWorkspace(conversationId, queryWorkspace);
  
  const specCandidates = [
    path.join(workspace, 'SPEC.md'),
    path.join(workspace, 'spec.md'),
    path.join(workspace, 'docs', 'SPEC.md')
  ];
  const roadmapCandidates = [
    path.join(workspace, 'ROADMAP.md'),
    path.join(workspace, 'roadmap.md'),
    path.join(workspace, 'docs', 'ROADMAP.md')
  ];

  let specPath = specCandidates.find(p => fs.existsSync(p)) || path.join(workspace, 'SPEC.md');
  let roadmapPath = roadmapCandidates.find(p => fs.existsSync(p)) || path.join(workspace, 'ROADMAP.md');

  const hasRealSpec = fs.existsSync(specPath);
  const hasRealRoadmap = fs.existsSync(roadmapPath);

  let rawSpecContent = hasRealSpec ? fs.readFileSync(specPath, 'utf-8') : '';
  let rawRoadmapContent = hasRealRoadmap ? fs.readFileSync(roadmapPath, 'utf-8') : '';

  if (!rawSpecContent) {
    const projectName = path.basename(workspace);
    rawSpecContent = `# Especificação Técnica: ${projectName}\n\n` +
      `> **Workspace:** \`${workspace}\`\n` +
      `> **Sessão Antigravity:** \`${conversationId}\`\n\n` +
      `## 1. 🎯 Objetivo Central & Escopo\n` +
      `Descreva aqui o propósito principal, público-alvo e problema que este projeto resolve.\n\n` +
      `## 2. 🛠️ Stack Tecnológica\n` +
      `- Frontend / UI: \n` +
      `- Backend / APIs: \n` +
      `- Banco de Dados / Storage: \n\n` +
      `## 3. 📋 Requisitos Funcionais & Entregas\n` +
      `1. Requisito 1: \n` +
      `2. Requisito 2: \n\n` +
      `## 4. 🏛️ Decisões de Arquitetura & Engenharia\n` +
      `- Padrão arquitetural adotado.\n` +
      `- Regras de integração e segurança.\n`;
  }

  if (!rawRoadmapContent) {
    const projectName = path.basename(workspace);
    rawRoadmapContent = `# Plano de Evolução (Roadmap): ${projectName}\n\n` +
      `> **Workspace:** \`${workspace}\`\n\n` +
      `## 🗺️ Marcos de Evolução (Milestones)\n\n` +
      `### 📌 Fase 1: MVP & Validação Inicial (100%)\n` +
      `- [x] Estrutura base e setup do repositório\n` +
      `- [x] Telas e fluxos essenciais\n\n` +
      `### 🔄 Fase 2: Otimizações & Ajustes de Produção (50%)\n` +
      `- [x] Refinamentos de interface e usabilidade\n` +
      `- [ ] Validação de ponta a ponta com usuários reais\n\n` +
      `### 🚀 Fase 3: Próximos Recursos\n` +
      `- [ ] Novas integrações\n`;
  }

  const transcriptData = getConversationTranscript(conversationId, 100);
  const steps = transcriptData?.steps || [];
  const modifiedFiles = new Set();
  steps.forEach((step) => {
    (step.toolCalls || []).forEach((tc) => {
      const args = tc.args || tc.arguments || {};
      const p = args.Path || args.path || tc.Path || tc.path;
      if (p) modifiedFiles.add(p);
    });
  });

  return {
    conversationId,
    workspace,
    title: path.basename(workspace) !== 'nader' ? path.basename(workspace) : 'Projeto Termius Agent',
    hasRealSpec,
    hasRealRoadmap,
    specPath,
    roadmapPath,
    rawSpecContent,
    rawRoadmapContent,
    affectedFilesCount: modifiedFiles.size,
    affectedFiles: Array.from(modifiedFiles).slice(0, 20).map(f => ({
      path: f,
      name: path.basename(f)
    }))
  };
}

/**
 * Salva o conteúdo do SPEC.md ou ROADMAP.md diretamente no arquivo do projeto
 */
function updateSpecAndRoadmap(conversationId, payload = {}) {
  const { workspace, specContent, roadmapContent } = payload;
  const targetWorkspace = workspace && fs.existsSync(workspace) ? workspace : detectConversationWorkspace(conversationId);

  const specPath = path.join(targetWorkspace, 'SPEC.md');
  const roadmapPath = path.join(targetWorkspace, 'ROADMAP.md');

  if (typeof specContent === 'string' && specContent.trim()) {
    fs.writeFileSync(specPath, specContent, 'utf-8');
  }

  if (typeof roadmapContent === 'string' && roadmapContent.trim()) {
    fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');
  }

  return generateSpecAndRoadmap(conversationId, targetWorkspace);
}

/**
 * Exporta ou força a gravação de SPEC.md e ROADMAP.md
 */
function exportSpecAndRoadmapToMarkdown(conversationId, options = {}) {
  const data = generateSpecAndRoadmap(conversationId, options.targetDir);
  const targetDir = data.workspace;

  fs.writeFileSync(data.specPath, data.rawSpecContent, 'utf-8');
  fs.writeFileSync(data.roadmapPath, data.rawRoadmapContent, 'utf-8');

  return {
    success: true,
    targetDir,
    specPath: data.specPath,
    roadmapPath: data.roadmapPath,
    specContent: data.rawSpecContent,
    roadmapContent: data.rawRoadmapContent
  };
}

module.exports = {
  detectConversationWorkspace,
  generateSpecAndRoadmap,
  updateSpecAndRoadmap,
  exportSpecAndRoadmapToMarkdown
};
