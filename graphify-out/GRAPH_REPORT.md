# Graph Report - termius-agent  (2026-11-01)

## Corpus Check
- 49 files · ~108,701 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 323 nodes · 522 edges · 19 communities (17 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b650df1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `✨ Principais Funcionalidades` - 12 edges
2. `🗺️ Marcos de Evolução (Milestones)` - 9 edges
3. `scripts` - 8 edges
4. `getAllSkills()` - 8 edges
5. `Termius Agent Suite ⚡` - 8 edges
6. `listDirectory()` - 7 edges
7. `loadTelemetry()` - 7 edges
8. `ErrorBoundary` - 7 edges
9. `sendNotification()` - 7 edges
10. `3. 📋 Requisitos Funcionais & Módulos Entregues` - 7 edges

## Surprising Connections (you probably didn't know these)
- `logBug()` --calls--> `recordTelemetryEvent()`  [EXTRACTED]
  src/services/telemetryTracker.js → src/services/api.js
- `submitManualImprovement()` --calls--> `recordTelemetryEvent()`  [EXTRACTED]
  src/services/telemetryTracker.js → src/services/api.js
- `generateCopilotCommand()` --calls--> `getRecentHistoryPrompts()`  [EXTRACTED]
  server/copilot.js → server/db.js
- `exportSpecAndRoadmapToMarkdown()` --calls--> `listConversations()`  [EXTRACTED]
  server/specRoadmapService.js → server/db.js
- `generateSpecAndRoadmap()` --calls--> `getConversationTranscript()`  [EXTRACTED]
  server/specRoadmapService.js → server/db.js

## Import Cycles
- None detected.

## Communities (19 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (42): AICopilotModal(), AISidecar(), ConversationHistoryModal(), FileManager(), HostsManager(), resolveCommand(), SnippetsManager(), SpecRoadmapModal() (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (36): CustomWorkModeModal(), KeyboardShortcutsModal(), SessionReplayModal(), Sidebar(), SkillsDropdownModal(), SmartCommandBar(), TerminalThemeModal(), TerminalView() (+28 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (35): dependencies, clsx, cors, express, lucide-react, react, react-dom, tailwind-merge (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (39): generateCopilotCommand(), KNOWLEDGE_PATTERNS, BRAIN_PATH, CLI_BASE_PATH, DB_PATH, getConversationTranscript(), getDbConnection(), getRecentHistoryPrompts() (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (20): 10. Serviço Completo de Telemetria & Auto-Melhorias, 11. Hardening de Segurança & Alta Resiliência, 1. Terminal Multiplexing & Split Panes Grid, 2. AI Terminal Copilot (`Ctrl + K`), 3. Smart Command Bar Preditiva (`Ctrl + Espaço`), 4. AI Sidecar ao Vivo (`Ctrl + Alt + A`), 5. Hub de Skills IA em Português BR (`Ctrl + Shift + S`), 6. Spec Técnica & Roadmap Automatizados por Conversa (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.26
Nodes (13): deleteEvent(), __dirname, __filename, generateAiDiagnostic(), getTelemetryMetrics(), listEvents(), loadTelemetry(), recordEvent() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (6): ErrorBoundary, recordTelemetryEvent(), initGlobalTelemetry(), logBug(), submitManualImprovement(), App()

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (10): Design Critique: Termius Agent Suite (`src`), Design Health Score, Design Specificity Verdict, [P1] AI Color Palette Tell & Neon Inconsistency, [P1] Split-Pane Active Perimeter Focus State, [P2] Actionable Empty States for Hosts & Snippets, [P2] Tab Bar Density & Horizontal Overflow Mask, Persona Red Flags (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (11): ✅ AI Sidecar ao Vivo (Docking Lateral) (100%), ✅ Diagnóstico Inicial & Resiliência de Processos (100%), ✅ Gestão Avançada de Conversas & Modo Fluido (100%), ✅ Hub de Skills em Português BR & Spec/Roadmap (100%), ✅ Links Clicáveis Universais, SFTP & File Explorer (v1.2.0) (100%), 🗺️ Marcos de Evolução (Milestones), ✅ Modos de Trabalho, UX/UI Impeccable & Gravação Avançada (v1.1.0) (100%), Plano de Evolução (Roadmap): quero que reveja o Ux e UI do app. temos skills para isso. (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.31
Nodes (9): BRAIN_PATH, cachedAgentCommands, classifyRisk(), cleanCommandString(), detectCategory(), getCommandSuggestions(), harvestAgentCommands(), harvestContextualCommands() (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (12): 1. 🎯 Objetivo Central & Escopo, 2. 🛠️ Stack Tecnológica, 3.1. Links Clicáveis Universais & Targeting de Linha, 3.2. Gerenciador de Arquivos & SFTP Integrado, 3.3. 3 Modos de Trabalho (Work Modes), 3.4. Visual Session Recorder & Replay Suite, 3.5. Snippets Paramétricos & Multi-Host Cluster Broadcast, 3.6. Design System & Usabilidade (Impeccable UI) (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (10): findSkillDirectories(), formatPortugueseTitle(), getAllSkills(), getSkillDetail(), inferCategory(), parseSkillDescription(), PT_BR_TRANSLATIONS, SKILL_ROOT_DIRS (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (8): 1. 📋 Resumo Executivo da Verificação, 2. 🏗️ Arquitetura e Estrutura de Componentes, 3. 🛡️ Segurança & Resiliência Inspecionadas, 4. 🎨 UX / UI e Otimizações Recentes, 5. 📊 Status da Telemetria, 6. 🔧 Correções Realizadas Durante a Verificação, Diagnóstico Rápido:, Relatório de Verificação e Auditoria Técnica: Termius Agent Suite ⚡

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (8): 1. 📊 Status Geral de Saúde & Versão Ativa, 2. 🛡️ Métricas do Smart Gate e Testes Automatizados, 3.1. Melhorias Recentes de UX/UI & Redundâncias, 3.2. Suíte de Arquivos e SFTP Integrado (Commits `1e39988` e `9d9c3b8`), 3. 📦 Entregas Recentes e Arquivos Modificados, 4. 🌐 Status dos Ambientes e Deploys, 5. 🗺️ Próximos Passos do Roadmap, Relatório de Atualização de Status: Termius Agent Suite

## Knowledge Gaps
- **118 isolated node(s):** `name`, `version`, `description`, `private`, `type` (+113 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ErrorBoundary` connect `Community 6` to `Community 1`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _118 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06453634085213032 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08156028368794327 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._