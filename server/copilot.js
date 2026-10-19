import { getRecentHistoryPrompts } from './db.js';

const KNOWLEDGE_PATTERNS = [
  // Ações Específicas Prioritárias
  {
    regex: /(matar porta|kill port|derrubar porta|encerrar porta)\s*(\d+)/i,
    generate: (match) => ({
      command: `fuser -k ${match[2]}/tcp`,
      explanation: `Envia sinal para encerrar qualquer processo escutando na porta TCP ${match[2]}.`,
      risk: 'caution'
    })
  },
  // Portas e Rede
  {
    regex: /(porta|portas|escutando|listening|ouvir|conex[oõ]es|abertas)/i,
    command: 'ss -tulpn | grep LISTEN',
    explanation: 'Lista todas as portas TCP/UDP abertas e em modo LISTEN com seus respectivos processos.',
    risk: 'safe'
  },
  {
    regex: /(ip|meu ip|interface|rede|ifconfig)/i,
    command: 'ip -c a',
    explanation: 'Exibe os endereços IP e status das interfaces de rede com cores.',
    risk: 'safe'
  },
  // Processos e Sistema
  {
    regex: /(mem[oó]ria|ram|swap)/i,
    command: 'free -h --wide',
    explanation: 'Exibe a memória RAM total, em uso e disponível, além da memória swap.',
    risk: 'safe'
  },
  {
    regex: /(maiores pastas|tamanho de pasta|pastas pesadas|du)/i,
    command: 'du -ah --max-depth=1 2>/dev/null | sort -hr | head -n 15',
    explanation: 'Identifica os 15 maiores arquivos ou diretórios dentro da pasta atual.',
    risk: 'safe'
  },
  {
    regex: /(disco|armazenamento|espa[cç]o|livre)/i,
    command: 'df -h -x tmpfs -x devtmpfs',
    explanation: 'Exibe o uso de disco das partições reais do sistema em formato legível.',
    risk: 'safe'
  },
  {
    regex: /(cpu|processador|top|monitorar|desempenho)/i,
    command: 'top -b -n 1 | head -n 25',
    explanation: 'Mostra o consumo instantâneo de CPU e os processos que mais demandam recursos.',
    risk: 'safe'
  },
  {
    regex: /(matar porta|kill port|derrubar porta)\s*(\d+)/i,
    generate: (match) => ({
      command: `fuser -k ${match[2]}/tcp`,
      explanation: `Envia sinal para encerrar qualquer processo escutando na porta TCP ${match[2]}.`,
      risk: 'caution'
    })
  },
  // Docker
  {
    regex: /(docker ps|containers|containeres|ativos|rodando)/i,
    command: "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
    explanation: 'Lista os containers Docker ativos com nome, status e mapeamento de portas.',
    risk: 'safe'
  },
  {
    regex: /(docker logs|logs docker|ver logs)/i,
    command: 'docker compose logs -f --tail=100',
    explanation: 'Acompanha em tempo real os últimos 100 registros de logs do docker compose.',
    risk: 'safe'
  },
  {
    regex: /(limpar docker|docker prune|remover containers velhos)/i,
    command: 'docker system prune -af --volumes',
    explanation: 'Remove containers parados, redes não utilizadas, imagens sem tag e volumes órfãos.',
    risk: 'destructive'
  },
  // Git
  {
    regex: /(git status|status git|modifica[cç][oõ]es)/i,
    command: 'git status -sb',
    explanation: 'Exibe o status do repositório Git em formato conciso com ramo atual.',
    risk: 'safe'
  },
  {
    regex: /(git log|commits|hist[oó]rico git)/i,
    command: "git log --oneline --graph --decorate -n 15",
    explanation: 'Exibe os últimos 15 commits com árvore gráfica visual no terminal.',
    risk: 'safe'
  },
  {
    regex: /(desfazer|descartar|reverter|limpar git)/i,
    command: 'git restore .',
    explanation: 'Descarta todas as alterações locais não commitadas no diretório de trabalho.',
    risk: 'destructive'
  },
  // Servidores & Serviços
  {
    regex: /(reiniciar|restart|service|systemctl)/i,
    command: 'sudo systemctl list-units --type=service --state=running',
    explanation: 'Lista todos os serviços do sistema systemd em execução ativa.',
    risk: 'safe'
  }
];

export async function generateCopilotCommand(query, cwd = '/home/nader') {
  if (!query || !query.trim()) {
    return {
      command: 'ls -la',
      explanation: 'Lista arquivos detalhados no diretório atual.',
      risk: 'safe',
      source: 'default'
    };
  }

  const cleanQuery = query.trim().toLowerCase();

  // 1. Verificação por regras de conhecimento
  for (const pattern of KNOWLEDGE_PATTERNS) {
    const match = query.match(pattern.regex);
    if (match) {
      if (pattern.generate) {
        const gen = pattern.generate(match);
        return { ...gen, source: 'pattern' };
      }
      return {
        command: pattern.command,
        explanation: pattern.explanation,
        risk: pattern.risk,
        source: 'pattern'
      };
    }
  }

  // 2. Busca no histórico do Antigravity CLI
  try {
    const history = getRecentHistoryPrompts(50);
    const matchedHistory = history.find(h => {
      const promptText = (h.prompt || h.text || '').toLowerCase();
      return promptText.includes(cleanQuery) || cleanQuery.split(' ').every(word => promptText.includes(word));
    });
    if (matchedHistory) {
      return {
        command: matchedHistory.prompt || matchedHistory.command,
        explanation: 'Comando recuperado do histórico de ações recentes do Antigravity.',
        risk: 'safe',
        source: 'history'
      };
    }
  } catch (err) {
    console.error('Erro ao pesquisar histórico para o Copilot:', err);
  }

  // 3. Fallback inteligente: tentar Ollama se disponível localmente
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2200);

    const ollamaRes = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meu-soup-custom:latest',
        prompt: `Você é um assistente de terminal Linux. Gere APENAS o comando bash correspondente à instrução: "${query}". Não adicione markdown nem explicações. Apenas a linha de comando.`,
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (ollamaRes.ok) {
      const data = await ollamaRes.json();
      const rawCmd = (data.response || '').trim().replace(/^```bash\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      if (rawCmd && rawCmd.length < 250) {
        return {
          command: rawCmd,
          explanation: `Gerado via IA Local para: "${query}"`,
          risk: rawCmd.includes('rm ') || rawCmd.includes('drop ') ? 'destructive' : 'safe',
          source: 'ollama'
        };
      }
    }
  } catch (e) {
    // Timeout ou modelo ocupado - silencioso
  }

  // 4. Fallback sintético baseado em palavras-chave comuns
  if (cleanQuery.includes('procurar') || cleanQuery.includes('buscar') || cleanQuery.includes('find')) {
    const term = cleanQuery.replace(/procurar|buscar|find|arquivo|arquivos/g, '').trim();
    return {
      command: `find . -iname "*${term || 'termo'}*" 2>/dev/null`,
      explanation: `Busca arquivos ou pastas contendo "${term}" recursivamente a partir do diretório atual.`,
      risk: 'safe',
      source: 'heuristic'
    };
  }

  return {
    command: `echo "Intenção: ${query}" && ls -la`,
    explanation: 'Nenhum padrão crítico detectado. Use o campo acima para especificar mais detalhes.',
    risk: 'safe',
    source: 'fallback'
  };
}
