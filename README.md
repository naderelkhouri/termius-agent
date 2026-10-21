# Termius Agent Suite ⚡

> **Terminal & SSH Suite inspired by Termius with integrated Antigravity AI Intelligence, Inline Copilot, Split Panes Multiplexer, and Continuous Telemetry.**

---

## 🚀 Visão Geral

O **Termius Agent Suite** é um ambiente de terminal moderno de alta performance que combina a elegância visual do Termius com a inteligência contextual do ecossistema **Antigravity AI**.

Projetado para desenvolvedores e operadores de infraestrutura, ele unifica conexões locais, sessões SSH remotas, geração autônoma de comandos por IA e um multiplexador de telas sem recarga de sessões.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TERMIUS AGENT SUITE V2.5                        │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Terminal Grid  │ 2. AI Copilot     │ 3. Telemetria & Auto-Healing   │
│  • Split Vertical │  • Ativação Ctrl+K│  • Diagnóstico de causa raiz   │
│  • Split Horiz.   │  • Análise Risco  │  • Captura passiva de falhas   │
│  • Zero-unmount   │  • Injeção shell  │  • Backlog de auto-melhorias   │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## ✨ Principais Funcionalidades

### 1. Terminal Multiplexing & Split Panes Grid
* **Divisão Flexível:** Alterne instantaneamente entre visualização em tela cheia, **Split Vertical** (`Ctrl + Alt + V`) ou **Split Horizontal** (`Ctrl + Alt + H`).
* **Preservação de Sessões:** Instâncias do PTY e conexões WebSocket não sofrem recarga (`zero unmount`), mantendo processos contínuos (`top`, `tail -f`, Docker builds) em execução paralela.
* **Seletor Dinâmico:** Escolha qual aba conectar no painel secundário sem perder o foco do terminal primário.

### 2. AI Terminal Copilot (`Ctrl + K`)
* **Linguagem Natural para Shell:** Descreva sua intenção (ex: *"listar portas abertas"*, *"15 maiores pastas no disco"*, *"derrubar processo na porta 8080"*) e obtenha o comando bash exato.
* **Classificação Visual de Risco:**
  * 🟢 **Seguro:** Comandos de consulta e leitura.
  * 🟡 **Atenção:** Encerramento de processos e modificações de serviço.
  * 🔴 **Destrutivo:** Remoções recursivas ou descartes de repositório.
* **Execução com 1 Clique:** Pressione `Enter` para injetar o comando diretamente no terminal ativo ou salve-o na biblioteca de Snippets.

### 3. Smart Command Bar Preditiva (`Ctrl + Espaço`)
* **Autocomplete Contextual no Terminal:** Barra preditiva acoplada na base do terminal que antecipa comandos com base no histórico real dos agentes Antigravity, scripts do `package.json`, comandos `git` e snippets salvos.
* **Navegação & Execução Ágil:**
  * **Navegação por Setas (`↑` / `↓`):** Selecione sugestões com preview instantâneo.
  * **Inserir no Prompt (`Tab`):** Insere o comando no shell sem executar, permitindo personalizar flags e argumentos antes do envio.
  * **Execução Direta (`Enter`):** Injeta e roda o comando no terminal ativo com 1 clique ou toque de teclado.
  * **Classificação de Risco Visual:** Selos em tempo real para comandos seguros (🟢), de atenção (🟡) e potencialmente destrutivos (🔴).
* **Filtros por Categoria:** Alterne instantaneamente entre `Todos`, `🤖 Antigravity AI`, `📦 NPM Scripts`, `⚡ Git`, `📋 Snippets` e `🔧 Sistema`.

### 4. AI Sidecar ao Vivo (`Ctrl + Alt + A`)
* **Painel Acoplado Lateralmente:** Acompanhe passos, raciocínio interno, chamadas de ferramentas e comandos bash em tempo real lado a lado com os terminais ativos sem sobreposição.
* **Abas Rápidas de Inspeção:**
  * **Timeline:** Visualização cronológica dos passos do usuário e do agente com expansão do pensamento da IA (*thinking*).
  * **Comandos:** Lista consolidada de todos os comandos bash executados com botão de **Injetar no Terminal** focado e copiar com 1 clique.
  * **Arquivos & Diffs:** Destaque de alterações e inspeções de arquivos com diff visual estilizado (*alvo removido vs substituição inserida*).
* **Seletor Rápido de Conversas:** Dropdown com busca instantânea e sincronização automática com a conversa vinculada à aba ativa.
* **Auto-Ajuste de Tela:** O terminal xterm se redimensiona automaticamente através de `ResizeObserver` sem desconexão de sessões.

### 5. Hub de Skills IA em Português BR (`Ctrl + Shift + S`)
* **Catálogo Completo de 340+ Especialistas:** Acesso instantâneo a todas as skills do ecossistema Antigravity e The Agency (`~/.agents/skills` e `~/.gemini/config/skills`).
* **Explicações em Português BR:** Títulos amigáveis, categorias traduzidas (Frontend, Backend, Segurança, QA, Mobile, etc.) e resumos explicativos em Português do Brasil.
* **Inspeção de Diretrizes & Adoção de Persona:** Visualize o conteúdo completo (`SKILL.md`) com diretrizes, regras críticas e prompts de ativação. Com 1 clique no botão **"Adotar Persona no Terminal"**, o comando `@skill-name` é injetado no shell ativo pronto para uso.

### 6. Spec Técnica & Roadmap Automatizados por Conversa
* **Especificação Técnica Integrada (📋 Spec):** Síntese automática a partir dos transcripts do Antigravity contendo escopo, objetivo principal, stack tecnológica identificada, requisitos funcionais detalhados com status (concluído / em progresso), decisões de arquitetura e lista de arquivos afetados.
* **Roadmap Interativo com Checklist (🗺️ Roadmap):** Plano de evolução da conversa organizado em milestones com barra de progresso global (`0% a 100%`), checklist de tarefas interativo com persistência automática no backend (`specRoadmapStorage.json`) e sugestões de próximas ações.
* **Exportação para Markdown com 1 Clique (SPEC.md & ROADMAP.md):** Salva os arquivos de especificação e roadmap formatados diretamente na raiz do projeto (`workspace`) para versionamento no Git e documentação de equipe.
* **Acesso em Múltiplos Pontos:** Disponível nas abas **Spec** e **Roadmap** do **AI Sidecar**, no **Histórico de Conversas** (tabela e blocos) e em modal dedicado de tela cheia.

### 7. Integração com o Cérebro do Antigravity AI & Modo Fluido
* **Consulta Inteligente:** Consulta em tempo real à base SQLite de conversas e transcripts (`.system_generated/logs/transcript.jsonl`).
* **Visualização Flexível (Blocos vs Tabela):** Alterne entre cartões visuais e uma tabela densa com ordenação crescente/decrescente em todas as colunas (Data, Título, Passos, Workspace e Favoritos).
* **Sistema de Favoritos (⭐):** Marque sessões prioritárias com persistência no backend e filtro rápido com 1 clique.
* **Modo Fluido Autônomo (⚡):** Ative por conversa ou na barra superior do terminal para auto-aprovar prompts de ferramentas (`Run this command? 1. Yes, run command; 2. Yes, and...`) via `--dangerously-skip-permissions` e auto-resposta em tempo real no PTY.

### 8. Gerenciador de Hosts & SSH
* Cadastro visual de máquinas locais, instâncias de containers e servidores VPS remotos.
* Sanitização estrita contra injeção de parâmetros SSH e separador seguro `--`.
* Tags coloridas, diretórios iniciais (`CWD`) configuráveis e agrupamento por ambiente (Produção, Local, Projetos).

### 9. Biblioteca de Snippets
* Automações de 1 clique para Docker, Git, Rede e Sistema.
* CRUD completo com exclusão segura e cópia para área de transferência.

### 10. Serviço Completo de Telemetria & Auto-Melhorias
* **Captura Passiva de Exceções:** Interceptação automática de `window.onerror` e rejeições assíncronas.
* **Diagnóstico Automático por IA:** Detecção de causa raiz e recomendação de correções para falhas de portas e conexões.
* **Melhorias Manuais & Automatizadas:** Backlog integrado para registro de melhorias e gatilho de varredura autônoma por IA.

### 11. Hardening de Segurança & Alta Resiliência
* **Single Instance Lock:** Prevenção de instâncias duplicadas no Electron, focando a janela ativa e evitando conflitos de porta.
* **Prevenção de PTY Órfãos:** Signal traps no Python (`SIGTERM`/`SIGHUP`/`SIGINT`) com encerramento de grupo de processos (`killpg`) e rastreamento ativo no Node.js.
* **Backups Rotativos:** Gravação atômica com swap temporário e fallback automático para cópias `.bak` em arquivos de storage.
* **React Error Boundary:** Prevenção contra tela preta em exceções da interface com telemetria automática e recuperação instantânea.
* **Escuta Local Segura:** Vinculação estrita a `127.0.0.1:3001` com bloqueio a ataques de CSWSH (Cross-Site WebSocket Hijacking).

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
| :--- | :--- |
| **`Ctrl + K`** | Abrir AI Terminal Copilot |
| **`Ctrl + Shift + S`** | Abrir **Hub de Skills IA (340+) em Português BR** |
| **`Ctrl + Espaço`** / **`Ctrl + Shift + P`** | Abrir / Alternar **Smart Command Bar Preditiva** |
| **`Ctrl + Alt + A`** | Abrir / Fechar **AI Sidecar ao Vivo** |
| **`Ctrl + Alt + V`** | Dividir Terminal Verticalmente (lado a lado) |
| **`Ctrl + Alt + H`** | Dividir Terminal Horizontalmente |
| **`Ctrl + Shift + T`** | Nova Aba de Terminal |
| **`Ctrl + Shift + V`** | Colar no Terminal Ativo |
| **`Tab`** *(na Smart Bar)* | Inserir comando selecionado no prompt sem executar |
| **`Enter`** *(na Smart Bar)* | Executar imediatamente no terminal focado |
| **`Enter`** *(no Copilot)* | Executar comando gerado no terminal focado |
| **`Esc`** | Fechar modais / limpar busca |

---

## 🛠️ Pilha Tecnológica

* **Frontend:** React 18, Vite, TailwindCSS, `@xterm/xterm` (v6), `@xterm/addon-fit`, `@xterm/addon-web-links`, `lucide-react`.
* **Backend:** Node.js, Express, `ws` (WebSocket Server), `node:sqlite` (DatabaseSync).
* **Terminal Bridge:** Python 3 (`pty.fork`, `fcntl`, `termios`, `select`).

---

## 📦 Instalação & Inicialização

### Pré-requisitos
* Node.js v20+ ou Bun
* Python 3

```bash
# 1. Clonar o repositório
git clone https://github.com/naderelkhouri/termius-agent.git
cd termius-agent

# 2. Instalar dependências
npm install
# ou: bun install

# 3. Compilar o frontend SPA
npm run build
# ou: bun run build

# 4. Iniciar o servidor
npm run server
# ou: bun run server
```

Acesse no navegador:
👉 **http://127.0.0.1:3001**

---

## 🖥️ Integração no Desktop (Ubuntu / Linux)

O script lançador pode ser instalado em `~/bin/termius-agent`:

```bash
mkdir -p ~/bin
cp bin/termius-agent ~/bin/termius-agent
chmod +x ~/bin/termius-agent
```

E a entrada de desktop em `~/.local/share/applications/termius-agent.desktop`:

```ini
[Desktop Entry]
Name=Termius Agent
Comment=Terminal & SSH Suite with integrated AI Agent history
Exec=/home/nader/bin/termius-agent
Icon=utilities-terminal
Terminal=false
Type=Application
Categories=Development;System;TerminalEmulator;
```

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
