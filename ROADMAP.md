# Plano de Evolução (Roadmap): quero que reveja o Ux e UI do app. temos skills para isso.
1
1
> **Progresso Geral:** **100% Concluído**
> **Sessão:** `9843fea2-1fc1-4cae-bf7f-387a99ed6500`
> **Data:** 21/10/2026, 18:16:10

## 🗺️ Marcos de Evolução (Milestones)

### ✅ Diagnóstico Inicial & Resiliência de Processos (100%)
_Prevenção de falhas no Electron, encerramento limpo de PTYs Python e isolamento de runtime._

**Checklist de Tarefas:**
- [x] Single Instance Lock no Electron
- [x] Signal Traps no Python PTY (killpg)
- [x] Armazenamento seguro com fallback .bak
- [x] React ErrorBoundary contra tela preta

### ✅ Gestão Avançada de Conversas & Modo Fluido (100%)
_Favoritos (⭐), alternância entre visão em blocos e tabela com ordenação, e auto-aprovação de comandos._

**Checklist de Tarefas:**
- [x] Sistema de Favoritos com persistência no backend
- [x] Visualização em Tabela com ordenação asc/desc
- [x] Modo Fluido com watcher de prompt no PTY

### ✅ AI Sidecar ao Vivo (Docking Lateral) (100%)
_Painel acoplado lateralmente sem unmount de terminal, streaming de passos, comandos e diffs._

**Checklist de Tarefas:**
- [x] Layout flexível com auto-resize via ResizeObserver
- [x] Streaming de passos da IA e raciocínio interno
- [x] Abas de Comandos com injeção 1-clique e Diffs de arquivos

### ✅ Smart Command Bar Preditiva (100%)
_Barra de comandos preditiva com histórico do agente, scripts npm e atalhos de sistema._

**Checklist de Tarefas:**
- [x] Coletor de comandos reais do Antigravity
- [x] Classificador de risco (Seguro / Atenção / Destrutivo)
- [x] Navegação por setas, Tab para inserir e Enter para rodar

### ✅ Hub de Skills em Português BR & Spec/Roadmap (100%)
_Menu dropdown de skills com descrições em PT-BR e gerador de Spec e Roadmap por conversa._

**Checklist de Tarefas:**
- [x] Catálogo de 340 skills com traduções em Português BR
- [x] Menu dropdown e modal de inspeção de skills
- [x] Geração e renderização de Spec e Roadmap dinâmicos
- [x] Exportação de Spec e Roadmap para Markdown (1 clique)

### ✅ Próximas Evoluções & Gravação de Sessões (100%)
_Asciicast/asciinema session recorder, broadcast multi-host e notificações desktop nativas._

**Checklist de Tarefas:**
- [x] Notificações Desktop Nativas no Linux/Gnome com Web Audio Chime
- [x] Visual Session Recorder & Replay (Asciicast v2 com timeline, velocidade e download .cast)
- [x] Cluster Execution em múltiplos servidores (Broadcast multi-host com digitação e comandos espelhados em paralelo)

### ✅ Modos de Trabalho, UX/UI Impeccable & Gravação Avançada (v1.1.0) (100%)
_3 Modos de Trabalho (FOCO, Expansivo, Custom), Design System Impeccable com fontes >=12px, histórico de gravações com importação drag-and-drop de arquivos .cast, execução em cluster de snippets e botão de rolagem rápida._

**Checklist de Tarefas:**
- [x] 3 Modos de Trabalho: FOCO (apenas terminais 100%), Expansivo (todas as opções visíveis), Custom (modal multiseletor com 9 opções)
- [x] Badge de escape e status interativo do Modo FOCO no topo e rodapé (`Ctrl + B`)
- [x] Design System Impeccable: Erradicação total de micro-fontes (<12px), anéis `:focus-visible` acessíveis, seleção nativa azul suave e badges `<kbd>`
- [x] Botão flutuante de rolagem rápida (`ArrowDown`) no terminal, chat do AI Sidecar e histórico
- [x] Histórico local persistente de gravações Asciicast v2 com drawer lateral de replay
- [x] Importação de arquivos `.cast` com seletor de arquivo e Drag & Drop
- [x] Controles ergonômicos de teclado no player (<kbd>Espaço</kbd>, <kbd>← / →</kbd>, <kbd>R</kbd>, <kbd>Esc</kbd>)
- [x] Execução de Snippets em lote com 1 clique (`[ 📡 Cluster (N) ]`)
- [x] Backup e restauração da Biblioteca de Snippets via importação/exportação JSON
- [x] Suíte de testes automatizados com 44 validações passando com 100% de sucesso

### ✅ Links Clicáveis Universais, SFTP & File Explorer (v1.2.0) (100%)
_Links clicáveis com targeting de linha no VS Code, explorador de arquivos local e remoto SFTP, editor de código inline com atalhos de teclado e suíte de testes de sistema de arquivos._

**Checklist de Tarefas:**
- [x] Links de arquivos universais no terminal (`file:///...` e caminhos absolutos crus)
- [x] Targeting de linha exata (`code --goto <path>:<line>`) ao clicar em links com `#L10` ou `:10`
- [x] Fallback automático para abertura no sistema operacional via `xdg-open`
- [x] Módulo `fileService.js` com suporte completo a metadados, permissões unix (`rwxr-xr-x`), formatação de tamanho e breadcrumbs
- [x] Endpoints REST `/api/fs/*` (list, read, write, mkdir, touch, rename, delete) com proteção contra caminhos do sistema
- [x] Suporte a listagem de arquivos remotos via SSH para hosts configurados
- [x] Componente `FileManager.jsx` com bookmarks rápidos (`~`, `Applications`, `Downloads`, `/`), visualização em tabela e busca em tempo real
- [x] Modal de Edição de Código Inline com salvamento rápido (<kbd>Ctrl+S</kbd>), contagem de linhas e indicador dirty
- [x] Integração na Sidebar com novo ícone `Arquivos & SFTP` e atalho global <kbd>Ctrl+Shift+E</kbd>
- [x] Suíte de testes unitários automatizados com `node --test` e 100% de sucesso

## 🚀 Próximos Passos Recomendados
- Utilizar o Gerenciador de Arquivos & SFTP (<kbd>Ctrl+Shift+E</kbd>) para navegar e editar arquivos sem sair do Termius Agent.
- Clicar em qualquer caminho ou log de arquivo no terminal para abri-lo instantaneamente na linha correspondente no VS Code.
- Utilizar o Cluster Broadcast (`Ctrl+Shift+B` ou botão `📡 Cluster` nos Snippets) para orquestrar frotas de servidores e abas paralelas.
- Gravar sessões críticas de terminal para documentação e auditoria em padrão Asciicast v2 com histórico persistente.
