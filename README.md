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

### 3. Integração com o Cérebro do Antigravity AI & Modo Fluido
* **Consulta Inteligente:** Consulta em tempo real à base SQLite de conversas e transcripts (`.system_generated/logs/transcript.jsonl`).
* **Visualização Flexível (Blocos vs Tabela):** Alterne entre cartões visuais e uma tabela densa com ordenação crescente/decrescente em todas as colunas (Data, Título, Passos, Workspace e Favoritos).
* **Sistema de Favoritos (⭐):** Marque sessões prioritárias com persistência no backend e filtro rápido com 1 clique.
* **Modo Fluido Autônomo (⚡):** Ative por conversa ou na barra superior do terminal para auto-aprovar prompts de ferramentas (`Run this command? 1. Yes, run command; 2. Yes, and...`) via `--dangerously-skip-permissions` e auto-resposta em tempo real no PTY.

### 4. Gerenciador de Hosts & SSH
* Cadastro visual de máquinas locais, instâncias de containers e servidores VPS remotos.
* Sanitização estrita contra injeção de parâmetros SSH e separador seguro `--`.
* Tags coloridas, diretórios iniciais (`CWD`) configuráveis e agrupamento por ambiente (Produção, Local, Projetos).

### 5. Biblioteca de Snippets
* Automações de 1 clique para Docker, Git, Rede e Sistema.
* CRUD completo com exclusão segura e cópia para área de transferência.

### 6. Serviço Completo de Telemetria & Auto-Melhorias
* **Captura Passiva de Exceções:** Interceptação automática de `window.onerror` e rejeições assíncronas.
* **Diagnóstico Automático por IA:** Detecção de causa raiz e recomendação de correções para falhas de portas e conexões.
* **Melhorias Manuais & Automatizadas:** Backlog integrado para registro de melhorias e gatilho de varredura autônoma por IA.

### 7. Hardening de Segurança & Alta Resiliência
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
| **`Ctrl + Alt + V`** | Dividir Terminal Verticalmente (lado a lado) |
| **`Ctrl + Alt + H`** | Dividir Terminal Horizontalmente |
| **`Ctrl + Shift + T`** | Nova Aba de Terminal |
| **`Ctrl + Shift + V`** | Colar no Terminal Ativo |
| **`Enter`** *(no Copilot)* | Executar comando gerado no terminal focado |
| **`Esc`** *(no Copilot)* | Fechar modal do Copilot |

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
