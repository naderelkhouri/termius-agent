# Especificação Técnica: Termius Agent Suite v1.1.0

> **Sessão Antigravity ID:** `9843fea2-1fc1-4cae-bf7f-387a99ed6500`
> **Projeto:** Termius Agent (Electron + React + Python PTY Bridge)
> **Versão:** `1.1.0-production`
> **Data:** 26/10/2026

---

## 1. 🎯 Objetivo Central & Escopo

O **Termius Agent Suite** é uma estação de trabalho de terminal profissional inspirada no Termius, com terminal SSH/Local multipainel integrado com bridge PTY Python em tempo real, streaming de conversas e telemetria do Antigravity CLI, 3 modos de trabalho ergonômicos, gravador de sessões Asciicast v2, biblioteca de snippets paramétricos com cluster broadcast e design system impecável com conformidade total de acessibilidade e legibilidade.

---

## 2. 🛠️ Stack Tecnológica

- **Desktop Framework:** Electron 44 com IPC nativo, auto-hide menu bar e aceleração por hardware Wayland.
- **Frontend SPA:** React 18, Vite 5, Tailwind CSS, Lucide React Icons.
- **Terminal Engine:** `@xterm/xterm` 6.0 com addons `@xterm/addon-fit`, `@xterm/addon-search`, `@xterm/addon-web-links`.
- **PTY Bridge Backend:** Node.js Express + WebSocket Server (`ws`) + Python 3 `ptyBridge.py` (com suporte a termios, fcntl e alocação de pseudo-terminais POSIX).
- **Formatos Padrão:** Asciicast v2 (`.cast`) para sessões, JSON Schema para persistência atômica com backup automático (`.bak`).

---

## 3. 📋 Requisitos Funcionais & Módulos Entregues

### 3.1. 3 Modos de Trabalho (Work Modes)
- **Modo FOCO (100% Terminais):** Oculta sidebar, top bar, smart bar e status bar, maximizando a área de digitação e execução. Possui badge superior de escape `[ 🎯 Modo FOCO | Sair (Ctrl+B) ]`.
- **Modo Expansivo:** Exibe layout completo com barra lateral de navegação (280px), sessões ativas, catálogo de skills e status bar inferior.
- **Modo Custom (Personalizado):** Modal multiseletor interativo com 9 toggles granulares (sidebar, estilo compacto, sessões, banners de IA, smart bar, sidecar, status bar, top actions, split controls) e presets rápidos.

### 3.2. Visual Session Recorder & Replay Suite
- **Gravação em Tempo Real:** Captura eventos de stdout com precisão de microssegundos em formato Asciicast v2.
- **Histórico Persistente Local:** Armazena as últimas gravações em cache com controle de cota e remoção seletiva.
- **Drawer Lateral no Player:** Lista de gravações passadas com data, duração e quantidade de eventos com 1 clique para carregar.
- **Importação `.cast` & Drag-and-Drop:** Permite abrir arquivos `.cast` externos ou arrastá-los diretamente para a janela do player.
- **Controles de Teclado:** <kbd>Espaço</kbd> para Play/Pause, <kbd>← / →</kbd> para salto de ±3s, <kbd>R</kbd> para reiniciar, seletor de velocidade (0.5x, 1x, 2x, 4x).

### 3.3. Snippets Paramétricos & Multi-Host Cluster Broadcast
- **Sintaxe de Variáveis:** Suporte a placeholders inteligentes `{{param:default}}` com modal automático de preenchimento.
- **Execução em Cluster com 1 Clique:** Botão `[ 📡 Cluster (N) ]` para despachar o comando em lote para todas as abas e servidores conectados simultaneamente.
- **Importação/Exportação JSON:** Backup e restauração da biblioteca de snippets com auto-merge seguro.
- **Duplicação de Snippets:** Clonagem rápida de comandos para criar variações sem digitação manual.

### 3.4. Design System & Usabilidade (Impeccable UI)
- **Harmonia Tipográfica:** Erradicação total de fontes sub-12px. Todos os indicadores, badges e metadados utilizam no mínimo 12px (`text-xs font-mono`).
- **Anéis de Foco & Seleção:** Configuração de `:focus-visible` acessível e `::selection` nativa em azul suave.
- **Botão Flutuante de Rolagem Rápida (`ArrowDown`):** Presente no terminal, chat do AI Sidecar e Histórico de Conversas para retorno instantâneo ao fim do buffer.
- **Navegação de Abas por Mouse Wheel:** Rotação da roda do mouse na barra de abas alterna rapidamente entre terminais abertos ou realiza rolagem horizontal com <kbd>Shift</kbd>.

---

## 4. 🏛️ Decisões de Arquitetura & Engenharia

1. **Zero-Unmount & Zero-Reload:** A alternância de visões (Terminais, Hosts, Snippets, Conversas, Telemetria) preserva intacto o estado de cada PTY Python em execução.
2. **Resiliência de Processos:** Processos PTY zumbis são prevenidos através de rastreamento no backend (`activePtyProcesses`) e encerramento com `SIGTERM` no evento `close` do WebSocket.
3. **Segurança de Origem (CSWSH):** Servidor WebSocket valida estritamente a origem contra whitelist (`ALLOWED_ORIGINS`).
4. **Resolução de Conflitos no Cluster:** Comandos em cluster broadcast são isolados por sessão para evitar corrupção de buffers paralelos.

---

## 5. 🧪 Cobertura de Testes Automatizados

- **Suíte 1:** Lógica e visibilidade dos 3 Modos de Trabalho (20 testes)
- **Suíte 2:** Saúde e latência da API REST HTTP (4 testes)
- **Suíte 3:** Conexão WebSocket e PTY em tempo real (3 testes)
- **Suíte 4:** Serialização, parser e histórico Asciicast v2 (9 testes)
- **Suíte 5:** Resolução de snippets paramétricos, dispatch de cluster e CRUD REST (8 testes)
- **Total:** 44/44 testes passando (0 falhas).
