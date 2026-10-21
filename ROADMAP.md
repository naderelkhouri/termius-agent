# Plano de Evolução (Roadmap): quero que reveja o Ux e UI do app. temos skills para isso.
1
1
> **Progresso Geral:** **84% Concluído**
> **Sessão:** `9843fea2-1fc1-4cae-bf7f-387a99ed6500`
> **Data:** 21/10/2026, 16:40:09

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

### 🔄 Hub de Skills em Português BR & Spec/Roadmap (85%)
_Menu dropdown de skills com descrições em PT-BR e gerador de Spec e Roadmap por conversa._

**Checklist de Tarefas:**
- [x] Catálogo de 340 skills com traduções em Português BR
- [x] Menu dropdown e modal de inspeção de skills
- [x] Geração e renderização de Spec e Roadmap dinâmicos

### 📌 Próximas Evoluções & Gravação de Sessões (33%)
_Asciicast/asciinema session recorder, broadcast multi-host e notificações desktop nativas._

**Checklist de Tarefas:**
- [x] Notificações Desktop Nativas no Linux/Gnome com Web Audio Chime
- [ ] Visual Session Recorder & Replay
- [ ] Cluster Execution em múltiplos servidores

## 🚀 Próximos Passos Recomendados
- Explorar o menu dropdown de Skills IA em Português BR para orquestrar especialistas.
- Acompanhar os requisitos da Spec e checklist do Roadmap diretamente no Sidecar da sessão.
