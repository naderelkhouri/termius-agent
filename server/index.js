import express from 'express';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { StringDecoder } from 'node:string_decoder';
import { fileURLToPath } from 'node:url';
import { listConversations, getConversationTranscript, getRecentHistoryPrompts } from './db.js';
import { generateCopilotCommand } from './copilot.js';
import { getCommandSuggestions } from './commandSuggestions.js';
import { getAllSkills, getSkillDetail } from './skillsService.js';
import { generateSpecAndRoadmap, updateSpecAndRoadmap, exportSpecAndRoadmapToMarkdown } from './specRoadmapService.js';
import { 
  recordEvent, 
  listEvents, 
  updateEvent, 
  deleteEvent, 
  getTelemetryMetrics, 
  runAutomatedImprovementAnalysis 
} from './telemetry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

const wss = new WebSocketServer({ 
  server, 
  path: '/ws',
  verifyClient: (info, callback) => {
    const origin = info.origin || info.req.headers.origin;
    if (!origin || ALLOWED_ORIGINS.has(origin)) {
      callback(true);
    } else {
      console.warn(`[Security] Bloqueada tentativa de conexão WebSocket de origem não autorizada: ${origin}`);
      callback(false, 403, 'Forbidden: Invalid Origin');
    }
  }
});

app.use(cors());
app.use(express.json());

const DIST_PATH = path.join(__dirname, '../dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
}

const STORAGE_PATH = path.join(__dirname, 'hostsStorage.json');
const STORAGE_BACKUP_PATH = path.join(__dirname, 'hostsStorage.json.bak');

function loadStorage() {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('[Storage] Erro ao ler storage principal, tentando backup...', e);
    try {
      if (fs.existsSync(STORAGE_BACKUP_PATH)) {
        return JSON.parse(fs.readFileSync(STORAGE_BACKUP_PATH, 'utf-8'));
      }
    } catch (bakErr) {
      console.error('[Storage] Erro ao ler backup de storage:', bakErr);
    }
  }
  return { hosts: [], snippets: [], favoriteConversations: [], fluidConversations: [] };
}

function saveStorage(data) {
  if (!data || !Array.isArray(data.hosts) || !Array.isArray(data.snippets)) {
    console.error('[Storage] Abortando salvamento: estrutura inválida para evitar perda de dados', data);
    return false;
  }
  if (!Array.isArray(data.favoriteConversations)) {
    data.favoriteConversations = [];
  }
  if (!Array.isArray(data.fluidConversations)) {
    data.fluidConversations = [];
  }
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      fs.copyFileSync(STORAGE_PATH, STORAGE_BACKUP_PATH);
    }
    const tmpPath = `${STORAGE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, STORAGE_PATH);
    return true;
  } catch (e) {
    console.error('[Storage] Erro ao salvar storage:', e);
    return false;
  }
}

// REST Endpoints
app.get('/api/conversations/favorites', (req, res) => {
  const data = loadStorage();
  res.json(data.favoriteConversations || []);
});

app.post('/api/conversations/favorites', (req, res) => {
  const { conversationId } = req.body || {};
  if (!conversationId) return res.status(400).json({ error: 'conversationId é obrigatório' });
  const data = loadStorage();
  if (!Array.isArray(data.favoriteConversations)) {
    data.favoriteConversations = [];
  }
  if (!data.favoriteConversations.includes(conversationId)) {
    data.favoriteConversations.push(conversationId);
  }
  saveStorage(data);
  res.json(data.favoriteConversations);
});

app.delete('/api/conversations/favorites/:id', (req, res) => {
  const conversationId = req.params.id;
  const data = loadStorage();
  if (Array.isArray(data.favoriteConversations)) {
    data.favoriteConversations = data.favoriteConversations.filter(id => id !== conversationId);
    saveStorage(data);
  }
  res.json(data.favoriteConversations || []);
});

app.get('/api/conversations/fluid', (req, res) => {
  const data = loadStorage();
  res.json(data.fluidConversations || []);
});

app.post('/api/conversations/fluid', (req, res) => {
  const { conversationId } = req.body || {};
  if (!conversationId) return res.status(400).json({ error: 'conversationId é obrigatório' });
  const data = loadStorage();
  if (!Array.isArray(data.fluidConversations)) {
    data.fluidConversations = [];
  }
  if (!data.fluidConversations.includes(conversationId)) {
    data.fluidConversations.push(conversationId);
  }
  saveStorage(data);
  res.json(data.fluidConversations);
});

app.delete('/api/conversations/fluid/:id', (req, res) => {
  const conversationId = req.params.id;
  const data = loadStorage();
  if (Array.isArray(data.fluidConversations)) {
    data.fluidConversations = data.fluidConversations.filter(id => id !== conversationId);
    saveStorage(data);
  }
  res.json(data.fluidConversations || []);
});

app.get('/api/conversations', (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const result = listConversations({ search, limit, offset });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/conversations/:id/transcript', (req, res) => {
  try {
    const result = getConversationTranscript(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const result = getRecentHistoryPrompts(limit);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/hosts', (req, res) => {
  const data = loadStorage();
  res.json(data.hosts || []);
});

app.post('/api/hosts', (req, res) => {
  const data = loadStorage();
  const newHost = { id: `host-${Date.now()}`, ...req.body };
  data.hosts.push(newHost);
  saveStorage(data);
  res.status(201).json(newHost);
});

app.delete('/api/hosts/:id', (req, res) => {
  const data = loadStorage();
  data.hosts = (data.hosts || []).filter(h => h.id !== req.params.id);
  saveStorage(data);
  res.json({ success: true });
});

app.get('/api/snippets', (req, res) => {
  const data = loadStorage();
  res.json(data.snippets || []);
});

app.post('/api/snippets', (req, res) => {
  const data = loadStorage();
  const newSnippet = { id: `snip-${Date.now()}`, ...req.body };
  data.snippets.push(newSnippet);
  saveStorage(data);
  res.status(201).json(newSnippet);
});

app.delete('/api/snippets/:id', (req, res) => {
  const data = loadStorage();
  data.snippets = (data.snippets || []).filter(s => s.id !== req.params.id);
  saveStorage(data);
  res.json({ success: true });
});

app.post('/api/copilot/suggest', async (req, res) => {
  try {
    const { query, cwd } = req.body || {};
    const suggestion = await generateCopilotCommand(query, cwd);
    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/commands/suggestions', (req, res) => {
  try {
    const { q, query, cwd, category, limit } = req.query;
    const storage = loadStorage();
    const suggestions = getCommandSuggestions({
      query: q || query || '',
      cwd: cwd || '/home/nader',
      category: category || 'all',
      limit: parseInt(limit, 10) || 25,
      snippets: storage.snippets || []
    });
    res.json(suggestions);
  } catch (err) {
    console.error('[Server] Erro ao obter sugestões de comandos:', err);
    res.status(500).json({ error: err.message, suggestions: [] });
  }
});

// Skills Endpoints
app.get('/api/skills', (req, res) => {
  try {
    const { search, category, limit } = req.query;
    const skills = getAllSkills({
      search: search || '',
      category: category || 'all',
      limit: parseInt(limit, 10) || 400
    });
    res.json(skills);
  } catch (err) {
    console.error('[Server] Erro ao listar skills:', err);
    res.status(500).json({ error: err.message, skills: [] });
  }
});

app.get('/api/skills/:name', (req, res) => {
  try {
    const detail = getSkillDetail(req.params.name);
    if (!detail) {
      return res.status(404).json({ error: 'Skill não encontrada' });
    }
    res.json(detail);
  } catch (err) {
    console.error(`[Server] Erro ao obter detalhe da skill ${req.params.name}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Spec & Roadmap Endpoints
app.get('/api/conversations/:id/spec-roadmap', (req, res) => {
  try {
    const data = generateSpecAndRoadmap(req.params.id);
    res.json(data);
  } catch (err) {
    console.error(`[Server] Erro ao obter spec/roadmap de ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/conversations/:id/spec-roadmap', (req, res) => {
  try {
    const updated = updateSpecAndRoadmap(req.params.id, req.body || {});
    res.json(updated);
  } catch (err) {
    console.error(`[Server] Erro ao atualizar spec/roadmap de ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations/:id/export-spec-roadmap', (req, res) => {
  try {
    const result = exportSpecAndRoadmapToMarkdown(req.params.id, req.body || {});
    res.json(result);
  } catch (err) {
    console.error(`[Server] Erro ao exportar spec/roadmap de ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Notificações Desktop Nativas
app.post('/api/notifications', (req, res) => {
  try {
    const { title, body } = req.body || {};
    if (process.platform === 'linux') {
      spawn('notify-send', ['-a', 'Termius Agent', title || 'Termius Agent', body || ''], { stdio: 'ignore' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Server] Erro ao enviar notificação:', err);
    res.status(500).json({ error: err.message });
  }
});

// Telemetry & Continuous Improvement Endpoints
app.get('/api/telemetry/metrics', (req, res) => {
  try {
    const metrics = getTelemetryMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/telemetry/events', (req, res) => {
  try {
    const { type, status, severity, limit } = req.query;
    const events = listEvents({ 
      type: type || null, 
      status: status || null, 
      severity: severity || null, 
      limit: parseInt(limit, 10) || 100 
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/telemetry/events', (req, res) => {
  try {
    const event = recordEvent(req.body);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/telemetry/events/:id', (req, res) => {
  try {
    const updated = updateEvent(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/telemetry/events/:id', (req, res) => {
  try {
    const success = deleteEvent(req.params.id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/telemetry/improvements/analyze', async (req, res) => {
  try {
    const suggestions = await runAutomatedImprovementAnalysis();
    res.json({ success: true, count: suggestions.length, suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rastreamento global de PTYs para evitar processos órfãos/zumbis
const activePtyProcesses = new Set();

// WebSocket Terminal Management
wss.on('connection', (ws) => {
  let ptyProc = null;
  const bridgeScript = path.join(__dirname, 'ptyBridge.py');

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());

      if (msg.type === 'init') {
        const defaultHome = process.env.HOME || os.homedir();
        const cwd = msg.cwd || defaultHome;
        const cols = parseInt(msg.cols, 10) || 80;
        const rows = parseInt(msg.rows, 10) || 24;

        let cmd = '/bin/bash';
        let cmdArgs = [];

        if (msg.host && msg.host.type === 'ssh') {
          cmd = 'ssh';
          const port = parseInt(msg.host.port, 10) || 22;
          cmdArgs = ['-p', String(port)];

          if (msg.host.keyPath && typeof msg.host.keyPath === 'string') {
            const cleanKeyPath = path.resolve(msg.host.keyPath);
            if (fs.existsSync(cleanKeyPath)) {
              cmdArgs.push('-i', cleanKeyPath);
            }
          }

          const cleanUser = String(msg.host.user || 'root').replace(/[^a-zA-Z0-9._-]/g, '');
          const cleanAddress = String(msg.host.address || '').replace(/[^a-zA-Z0-9.-]/g, '');

          if (!cleanAddress || cleanAddress.startsWith('-') || cleanUser.startsWith('-')) {
            throw new Error('Host SSH ou usuário inválido');
          }

          cmdArgs.push('--', `${cleanUser}@${cleanAddress}`);
        }

        const pythonArgs = [
          bridgeScript,
          '--cwd', cwd,
          '--cols', String(cols),
          '--rows', String(rows),
          '--cmd', cmd
        ];
        if (cmdArgs.length > 0) {
          pythonArgs.push('--args', ...cmdArgs);
        }

        ptyProc = spawn('python3', pythonArgs, {
          stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor'
          }
        });

        activePtyProcesses.add(ptyProc);

        const stdoutDecoder = new StringDecoder('utf-8');
        ptyProc.stdout.on('data', (chunk) => {
          if (ws.readyState === WebSocket.OPEN) {
            const data = stdoutDecoder.write(chunk);
            if (data) {
              ws.send(JSON.stringify({ type: 'output', data }));
            }
          }
        });

        const stderrDecoder = new StringDecoder('utf-8');
        ptyProc.stderr.on('data', (chunk) => {
          if (ws.readyState === WebSocket.OPEN) {
            const data = stderrDecoder.write(chunk);
            if (data) {
              ws.send(JSON.stringify({ type: 'output', data }));
            }
          }
        });

        ptyProc.on('exit', (code) => {
          activePtyProcesses.delete(ptyProc);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'exit', code }));
            ws.close();
          }
        });

      } else if (msg.type === 'input' && ptyProc) {
        if (ptyProc.stdin && !ptyProc.stdin.destroyed) {
          ptyProc.stdin.write(msg.data);
        }
      } else if (msg.type === 'resize' && ptyProc) {
        if (ptyProc.stdio[3] && !ptyProc.stdio[3].destroyed) {
          ptyProc.stdio[3].write(`${msg.cols} ${msg.rows}\n`);
        } else if (ptyProc.stdin && !ptyProc.stdin.destroyed) {
          ptyProc.stdin.write(`__RESIZE__ ${msg.cols} ${msg.rows}\n`);
        }
      }
    } catch (e) {
      console.error('WS Message error:', e);
    }
  });

  ws.on('close', () => {
    if (ptyProc) {
      activePtyProcesses.delete(ptyProc);
      try {
        ptyProc.kill('SIGTERM');
      } catch {}
    }
  });
});

const PORT = 3001;

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
    return next();
  }
  const indexPath = path.join(DIST_PATH, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Termius Agent Backend running on http://127.0.0.1:${PORT}`);
});

// Limpeza segura de processos em caso de encerramento do backend
function cleanupAllProcesses() {
  if (activePtyProcesses.size > 0) {
    console.log(`[Termius Agent] Limpando ${activePtyProcesses.size} processos PTY ativos...`);
    for (const proc of activePtyProcesses) {
      try {
        proc.kill('SIGTERM');
      } catch {}
    }
    activePtyProcesses.clear();
  }
}

process.on('SIGTERM', () => {
  cleanupAllProcesses();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  cleanupAllProcesses();
  server.close(() => process.exit(0));
});

process.on('exit', () => {
  cleanupAllProcesses();
});

// Captura de exceções e rejeições globais com registro em telemetria
process.on('uncaughtException', (err) => {
  console.error('[Termius Agent Server] Uncaught Exception:', err);
  try {
    recordEvent({
      type: 'bug',
      title: 'Uncaught Exception no Backend Node.js',
      message: err.message,
      stack: err.stack,
      severity: 'critical',
      source: 'backend_uncaught_exception'
    });
  } catch {}
});

process.on('unhandledRejection', (reason) => {
  console.error('[Termius Agent Server] Unhandled Rejection:', reason);
  try {
    recordEvent({
      type: 'bug',
      title: 'Unhandled Rejection no Backend Node.js',
      message: String(reason),
      severity: 'medium',
      source: 'backend_unhandled_rejection'
    });
  } catch {}
});
