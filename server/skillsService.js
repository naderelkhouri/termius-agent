import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HOME_DIR = process.env.HOME || os.homedir();
const SKILL_DIRS = [
  path.join(HOME_DIR, '.agents/skills'),
  path.join(HOME_DIR, '.gemini/config/skills')
];

// Dicionário de títulos humanos e explicações refinadas em Português BR para skills chave
const PT_BR_TRANSLATIONS = {
  'agency-frontend-developer': {
    title: 'Desenvolvedor Frontend Sênior',
    category: 'Frontend & UI/UX',
    description: 'Especialista em React, TailwindCSS, arquitetura de componentes modernos, responsividade, acessibilidade e performance de interface.'
  },
  'agency-backend-architect': {
    title: 'Arquiteto de Backend & APIs',
    category: 'Backend & Bancos de Dados',
    description: 'Especialista em microsserviços escaláveis, design de schemas, contratos REST/RPC, caching, filas assíncronas e alta disponibilidade.'
  },
  'agency-database-optimizer': {
    title: 'Otimizador de Banco de Dados & SQL',
    category: 'Backend & Bancos de Dados',
    description: 'Especialista em modelagem de dados, índices compostos, planos de execução (EXPLAIN), tuning de queries e migrações zero-downtime.'
  },
  'agency-api-platform-engineer': {
    title: 'Engenheiro de Plataforma de APIs',
    category: 'Backend & Bancos de Dados',
    description: 'Especialista em design de APIs orientadas a contrato (OpenAPI/gRPC), versionamento seguro, gateways, autenticação e rate limiting.'
  },
  'agency-application-security-engineer': {
    title: 'Engenheiro de Segurança de Aplicações (AppSec)',
    category: 'Segurança & Auditoria',
    description: 'Especialista em padrões OWASP, modelagem de ameaças, revisão segura de código, proteção contra injeções, XSS, CSRF e sanitização.'
  },
  'agency-ai-generated-code-security-auditor': {
    title: 'Auditor de Segurança para Código IA',
    category: 'Segurança & Auditoria',
    description: 'Audita código gerado por IA em busca de alucinações de bibliotecas, credenciais vazadas, permissões excessivas e vulnerabilidades lógicas.'
  },
  'agency-blockchain-security-auditor': {
    title: 'Auditor de Smart Contracts & Web3',
    category: 'Segurança & Auditoria',
    description: 'Especialista em auditoria de contratos inteligentes EVM, DeFi, reentrancy, controle de acesso e análise estática formal.'
  },
  'agency-qa-engineer': {
    title: 'Engenheiro de QA & Testes Automatizados',
    category: 'QA, Testes & Resiliência',
    description: 'Especialista em testes unitários, de integração e e2e, cobertura de código, regressão e validação rigorosa antes de release.'
  },
  'agency-evidence-collector': {
    title: 'Coletor de Evidências & Provas de Execução',
    category: 'QA, Testes & Resiliência',
    description: 'Exige comprovação empírica de funcionamento através de logs, comandos, capturas e testes concretos antes de aprovar entregas.'
  },
  'agency-reality-checker': {
    title: 'Validador de Realidade & Auditor de Entregas',
    category: 'QA, Testes & Resiliência',
    description: 'Previne aprovações prematuras, confronta suposições com o código em produção e garante que tudo funciona de fato.'
  },
  'agency-minimal-change-engineer': {
    title: 'Engenheiro de Diffs Cirúrgicos & Correção Mínima',
    category: 'QA, Testes & Resiliência',
    description: 'Focado em resolver a causa raiz com a menor alteração viável de código, evitando refatorações desnecessárias e quebras colaterais.'
  },
  'agency-agents-orchestrator': {
    title: 'Orquestrador Autônomo de Agentes',
    category: 'IA, Prompts & Agentes',
    description: 'Gerencia o pipeline completo de engenharia, decompondo problemas em especificações, arquitetura, loop de tarefas e gates de release.'
  },
  'agency-prompt-engineer': {
    title: 'Engenheiro de Prompts para LLMs',
    category: 'IA, Prompts & Agentes',
    description: 'Cria e refina prompts estruturados para modelos de linguagem com few-shot, restrições precisas e comportamento determinístico.'
  },
  'agency-rag-pipeline-engineer': {
    title: 'Engenheiro de RAG & Recuperação Vetorial',
    category: 'IA, Prompts & Agentes',
    description: 'Especialista em chunking de documentos, embeddings, busca híbrida (BM25 + vetorial), re-ranking e pipelines de recuperação contextual.'
  },
  'agency-growth-hacker': {
    title: 'Especialista em Growth Hacking & Aquisição',
    category: 'Growth, Marketing & Social',
    description: 'Desenvolve experimentos baseados em dados, loops de viralidade, otimização de funis e canais escaláveis de aquisição de usuários.'
  },
  'agency-seo-specialist': {
    title: 'Especialista em SEO Técnico & Orgânico',
    category: 'Growth, Marketing & Social',
    description: 'Otimiza arquitetura da web, Core Web Vitals, metadados semânticos, indexabilidade e autoridade orgânica em mecanismos de busca.'
  },
  'agency-social-commerce-architect': {
    title: 'Arquiteto de Social Commerce & Vendas',
    category: 'Growth, Marketing & Social',
    description: 'Estratégias de conversão para TikTok/YouTube Shop, automação de vídeos com IA, funis de vendas conversacionais e GMV.'
  },
  'agency-devops-automator': {
    title: 'Automatizador DevOps & CI/CD',
    category: 'DevOps, Nuvem & Infra',
    description: 'Especialista em automação de infraestrutura, pipelines de deploy contínuo, Docker, GitHub Actions e cloud operations.'
  },
  'agency-cloud-security-architect': {
    title: 'Arquiteto de Segurança em Nuvem',
    category: 'DevOps, Nuvem & Infra',
    description: 'Projeta arquiteturas Zero Trust, defesa em profundidade em AWS, Azure e GCP, e segurança em Infrastructure as Code.'
  },
  'agency-sre-site-reliability-engineer': {
    title: 'Engenheiro de Confiabilidade de Sites (SRE)',
    category: 'DevOps, Nuvem & Infra',
    description: 'Especialista em SLOs, error budgets, observabilidade em produção, telemetria, mitigação de incidentes e tolerância a falhas.'
  },
  'agency-ui-ux-designer': {
    title: 'Designer de UI/UX & Sistemas Visuais',
    category: 'Frontend & UI/UX',
    description: 'Cria interfaces elegantes, consistentes, intuitivas e acessíveis, priorizando harmonia visual, tipografia e ergonomia de uso.'
  },
  'agency-ui-finish-gate-reviewer': {
    title: 'Revisor de Acabamento & Polish de UI',
    category: 'Frontend & UI/UX',
    description: 'Garante padrão estético superior, revisando espaçamentos, microinterações, contraste e eliminando aparências genéricas antes do lançamento.'
  },
  'agency-mobile-typography-readability': {
    title: 'Especialista em Tipografia & Leitura Mobile',
    category: 'Frontend & UI/UX',
    description: 'Otimiza legibilidade de texto em telas pequenas, ritmo vertical, tamanhos mínimos de fonte (12px+) e quebras de linha naturais.'
  },
  'agency-deal-strategist': {
    title: 'Estrategista de Negócios & Vendas B2B',
    category: 'Negócios, Vendas & Finanças',
    description: 'Qualificação MEDDPICC, posicionamento competitivo, identificação de riscos de pipeline e planos de fechamento de negócios.'
  },
  'agency-outbound-strategist': {
    title: 'Estrategista de Prospecção & Outbound',
    category: 'Negócios, Vendas & Finanças',
    description: 'Desenha cadências multicanal de prospecção, definição de ICP (Perfil de Cliente Ideal) e mensagens de alta conversão baseadas em sinais.'
  },
  'agency-chief-of-staff': {
    title: 'Chefe de Gabinete & Coordenador Executivo',
    category: 'Negócios, Vendas & Finanças',
    description: 'Filtra ruídos, gerencia processos críticos, direciona decisões estratégicas e estrutura entregas para máxima clareza operacional.'
  },
  'agency-workflow-architect': {
    title: 'Arquiteto de Fluxos de Trabalho & Automação',
    category: 'Negócios, Vendas & Finanças',
    description: 'Mapeia, otimiza e automatiza processos de negócio com ferramentas como n8n, webhooks e integrações de dados unificadas.'
  },
  'agency-godot-gameplay-scripter': {
    title: 'Programador de Gameplay em Godot 4',
    category: 'Games, 3D & Spatial',
    description: 'Especialista em GDScript 2.0, arquitetura baseada em nós, sinais fortemente tipados e mecânicas responsivas para jogos 2D/3D.'
  },
  'agency-unity-architect': {
    title: 'Arquiteto de Sistemas Unity',
    category: 'Games, 3D & Spatial',
    description: 'Especialista em arquitetura modular orientada a dados com ScriptableObjects, Netcode for GameObjects e shaders para Unity.'
  },
  'agency-3d-scene-developer': {
    title: 'Desenvolvedor de Cenas 3D na Web',
    category: 'Games, 3D & Spatial',
    description: 'Cria experiências 3D interativas, visualizações de terrenos e nuvens de pontos usando Three.js, Cesium e WebGL moderno.'
  }
};

/**
 * Traduz e normaliza a categoria baseada no nome e descrição da skill
 */
function inferCategory(name, desc = '') {
  const n = name.toLowerCase();
  const d = desc.toLowerCase();

  if (n.includes('frontend') || n.includes('ui-') || n.includes('ux') || n.includes('typography') || n.includes('css')) {
    return 'Frontend & UI/UX';
  }
  if (n.includes('backend') || n.includes('api') || n.includes('database') || n.includes('sql') || n.includes('postgres')) {
    return 'Backend & Bancos de Dados';
  }
  if (n.includes('security') || n.includes('auditor') || n.includes('penetration') || n.includes('compliance') || n.includes('secret')) {
    return 'Segurança & Auditoria';
  }
  if (n.includes('qa-') || n.includes('test') || n.includes('evidence') || n.includes('reality') || n.includes('minimal-change')) {
    return 'QA, Testes & Resiliência';
  }
  if (n.includes('growth') || n.includes('seo') || n.includes('social') || n.includes('tiktok') || n.includes('instagram') || n.includes('marketing')) {
    return 'Growth, Marketing & Social';
  }
  if (n.includes('orchestrator') || n.includes('prompt') || n.includes('rag') || n.includes('agent') || n.includes('llm') || n.includes('ai-')) {
    return 'IA, Prompts & Agentes';
  }
  if (n.includes('devops') || n.includes('cloud') || n.includes('sre') || n.includes('network') || n.includes('docker') || n.includes('kubernetes')) {
    return 'DevOps, Nuvem & Infra';
  }
  if (n.includes('godot') || n.includes('unity') || n.includes('unreal') || n.includes('game') || n.includes('3d') || n.includes('spatial') || n.includes('blender')) {
    return 'Games, 3D & Spatial';
  }
  if (n.includes('deal') || n.includes('sales') || n.includes('finance') || n.includes('chief') || n.includes('workflow') || n.includes('pricing') || n.includes('business')) {
    return 'Negócios, Vendas & Finanças';
  }
  if (n.includes('flutter') || n.includes('dart') || n.includes('mobile') || n.includes('ios') || n.includes('android')) {
    return 'Mobile, Flutter & App';
  }
  if (n.includes('remotion') || n.includes('video') || n.includes('audio') || n.includes('multimedia')) {
    return 'Vídeo & Multimídia';
  }
  return 'Especialistas Gerais';
}

/**
 * Traduz automaticamente descrições em inglês para português de forma clara e fluida
 */
function translateDescription(name, rawDesc = '') {
  if (PT_BR_TRANSLATIONS[name]?.description) {
    return PT_BR_TRANSLATIONS[name].description;
  }
  if (!rawDesc) {
    return 'Especialista autônomo com diretrizes e protocolos avançados de engenharia.';
  }

  // Traduções de prefixos e termos comuns
  let d = rawDesc
    .replace(/^Expert\s+/i, 'Especialista em ')
    .replace(/^Specialist in\s+/i, 'Especialista em ')
    .replace(/^Senior\s+/i, 'Sênior especialista em ')
    .replace(/^Autonomous\s+/i, 'Agente autônomo especialista em ')
    .replace(/specializing in\s+/gi, 'especializado em ')
    .replace(/focused on\s+/gi, 'focado em ')
    .replace(/who audits\s+/gi, 'que audita ')
    .replace(/who creates\s+/gi, 'que desenvolve ')
    .replace(/who builds\s+/gi, 'que constrói ')
    .replace(/across\s+/gi, 'em ')
    .replace(/best practices/gi, 'melhores práticas')
    .replace(/high-performance/gi, 'alta performance')
    .replace(/real-time/gi, 'tempo real')
    .replace(/scalable/gi, 'escalável')
    .replace(/security/gi, 'segurança')
    .replace(/performance/gi, 'desempenho')
    .replace(/workflows/gi, 'fluxos de trabalho');

  return d;
}

/**
 * Gera um título amigável em Português BR a partir do identificador da skill
 */
function formatPortugueseTitle(name) {
  if (PT_BR_TRANSLATIONS[name]?.title) {
    return PT_BR_TRANSLATIONS[name].title;
  }

  const clean = name.replace(/^agency-/, '');
  const words = clean.split('-').map((w) => {
    if (w === 'ai') return 'IA';
    if (w === 'api' || w === 'apis') return 'APIs';
    if (w === 'qa') return 'QA';
    if (w === 'ui') return 'UI';
    if (w === 'ux') return 'UX';
    if (w === 'seo') return 'SEO';
    if (w === 'sre') return 'SRE';
    if (w === 'rag') return 'RAG';
    if (w === 'llm') return 'LLM';
    if (w === 'sql') return 'SQL';
    if (w === 'gis') return 'GIS';
    if (w === '3d') return '3D';
    if (w === 'b2b') return 'B2B';
    return w.charAt(0).toUpperCase() + w.slice(1);
  });

  return words.join(' ');
}

let cachedSkills = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60000; // 1 minuto

/**
 * Retorna todas as skills disponíveis mapeadas com metadados e explicações em Português BR
 */
export function getAllSkills({ search = '', category = 'all', limit = 400 } = {}) {
  const now = Date.now();
  if (!cachedSkills || now - lastCacheTime > CACHE_TTL_MS) {
    const list = [];
    const seen = new Set();

    for (const dir of SKILL_DIRS) {
      if (!fs.existsSync(dir)) continue;

      let entries = [];
      try {
        entries = fs.readdirSync(dir);
      } catch {
        continue;
      }

      for (const name of entries) {
        if (seen.has(name) || name.startsWith('.')) continue;
        seen.add(name);

        const skillDir = path.join(dir, name);
        const skillMd = path.join(skillDir, 'SKILL.md');
        let rawDesc = '';
        let hasDetails = false;

        if (fs.existsSync(skillMd)) {
          hasDetails = true;
          try {
            const head = fs.readFileSync(skillMd, 'utf-8').slice(0, 800);
            const match = head.match(/description:\s*(.+)/i);
            if (match) rawDesc = match[1].trim();
          } catch {}
        }

        const cat = PT_BR_TRANSLATIONS[name]?.category || inferCategory(name, rawDesc);
        const titlePt = formatPortugueseTitle(name);
        const descPt = translateDescription(name, rawDesc);

        list.push({
          id: name,
          name,
          title: titlePt,
          description: descPt,
          rawDescription: rawDesc,
          category: cat,
          hasDetails,
          path: skillDir,
          promptCommand: `Adote a persona e execute segundo as diretrizes de @${name}`
        });
      }
    }

    // Ordena priorizando The Agency e ordem alfabética
    list.sort((a, b) => {
      if (a.name.startsWith('agency-') && !b.name.startsWith('agency-')) return -1;
      if (!a.name.startsWith('agency-') && b.name.startsWith('agency-')) return 1;
      return a.title.localeCompare(b.title, 'pt-BR');
    });

    cachedSkills = list;
    lastCacheTime = now;
  }

  let results = cachedSkills;

  if (category && category !== 'all') {
    results = results.filter((s) => s.category.toLowerCase() === category.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }

  return results.slice(0, limit);
}

/**
 * Retorna as regras e diretrizes completas de uma skill específica
 */
export function getSkillDetail(name) {
  if (!name || typeof name !== 'string') return null;
  const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '');

  for (const dir of SKILL_DIRS) {
    const skillMd = path.join(dir, cleanName, 'SKILL.md');
    if (fs.existsSync(skillMd)) {
      try {
        const content = fs.readFileSync(skillMd, 'utf-8');
        return {
          name: cleanName,
          title: formatPortugueseTitle(cleanName),
          content,
          category: inferCategory(cleanName, content.slice(0, 300))
        };
      } catch (err) {
        console.error(`[SkillsService] Erro ao ler detalhe de ${name}:`, err);
      }
    }
  }
  return null;
}
