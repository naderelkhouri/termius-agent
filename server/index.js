import express from 'express';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { listConversations, getConversationTranscript, getRecentHistoryPrompts } from './db.js';
import { generateCopilotCommand } from './copilot.js';
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

function loadStorage() {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading storage:', e);
  }
  return { hosts: [], snippets: [] };
}

function saveStorage(data) {
  try {
    const tmpPath = `${STORAGE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, STORAGE_PATH);
  } catch (e) {
    console.error('Error saving storage:', e);
  }
}

// REST Endpoints
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
          env: {
            ...process.env,
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor'
          }
        });

        ptyProc.stdout.on('data', (data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'output', data: data.toString('utf-8') }));
          }
        });

        ptyProc.stderr.on('data', (data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'output', data: data.toString('utf-8') }));
          }
        });

        ptyProc.on('exit', (code) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'exit', code }));
            ws.close();
          }
        });

      } else if (msg.type === 'input' && ptyProc) {
        ptyProc.stdin.write(msg.data);
      } else if (msg.type === 'resize' && ptyProc) {
        ptyProc.stdin.write(`__RESIZE__ ${msg.cols} ${msg.rows}\n`);
      }
    } catch (e) {
      console.error('WS Message error:', e);
    }
  });

  ws.on('close', () => {
    if (ptyProc) {
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
