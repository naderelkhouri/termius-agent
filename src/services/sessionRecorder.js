/**
 * Serviço de Gravação e Reprodução de Sessões de Terminal (Asciicast v2)
 * Termius Agent Suite
 */

const activeRecordings = new Map();

export function isRecording(tabId) {
  return activeRecordings.has(tabId);
}

export function getActiveRecording(tabId) {
  return activeRecordings.get(tabId) || null;
}

export function startRecording(tabId, { title = 'Sessão Termius Agent', cols = 80, rows = 24 } = {}) {
  const startTime = Date.now();
  const session = {
    tabId,
    startTime,
    header: {
      version: 2,
      width: cols,
      height: rows,
      timestamp: Math.floor(startTime / 1000),
      title: title || 'Sessão Termius Agent',
      env: {
        TERM: 'xterm-256color',
        SHELL: '/bin/bash'
      }
    },
    events: [],
    subscribers: new Set()
  };

  activeRecordings.set(tabId, session);
  return session;
}

export function recordOutput(tabId, data) {
  const session = activeRecordings.get(tabId);
  if (!session || !data) return;

  const offset = (Date.now() - session.startTime) / 1000;
  const event = [Number(offset.toFixed(4)), 'o', data];
  session.events.push(event);

  session.subscribers.forEach((cb) => {
    try {
      cb(event, session.events.length);
    } catch {}
  });
}

export function stopRecording(tabId) {
  const session = activeRecordings.get(tabId);
  if (!session) return null;

  activeRecordings.delete(tabId);
  const duration = (Date.now() - session.startTime) / 1000;

  const result = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    header: session.header,
    events: session.events,
    duration: Number(duration.toFixed(2)),
    createdAt: new Date(session.startTime).toISOString(),
    eventCount: session.events.length
  };

  saveRecordingToHistory(result);

  return result;
}

const STORAGE_KEY = 'termius_recorded_sessions';
const MAX_SAVED_SESSIONS = 15;

/**
 * Salva a gravação no histórico local do navegador
 */
export function saveRecordingToHistory(recording) {
  if (!recording || !recording.events || recording.events.length === 0) return;
  try {
    const history = getRecordingHistory();
    // Remove se já existir com o mesmo id
    const filtered = history.filter((r) => r.id !== recording.id);
    filtered.unshift(recording);
    // Limita aos mais recentes
    const pruned = filtered.slice(0, MAX_SAVED_SESSIONS);
    
    // Tenta salvar; se estourar cota, remove os mais antigos até caber
    let saved = false;
    while (!saved && pruned.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        saved = true;
      } catch (e) {
        if (pruned.length > 1) {
          pruned.pop(); // Remove o mais antigo e tenta novamente
        } else {
          break;
        }
      }
    }
  } catch (err) {
    console.warn('[SessionRecorder] Erro ao persistir gravação:', err);
  }
}

/**
 * Recupera o histórico de gravações salvas
 */
export function getRecordingHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Exclui uma gravação do histórico
 */
export function deleteRecordingFromHistory(recordingId) {
  try {
    const history = getRecordingHistory();
    const updated = history.filter((r) => r.id !== recordingId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Limpa todo o histórico de gravações
 */
export function clearRecordingHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch {
    return [];
  }
}

/**
 * Converte arquivo .cast (Asciicast v2) para objeto de gravação
 */
export function parseAsciicast(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('Conteúdo inválido para arquivo .cast');
  }

  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) {
    throw new Error('Arquivo .cast está vazio');
  }

  let header;
  try {
    header = JSON.parse(lines[0]);
  } catch (e) {
    throw new Error(`Cabeçalho Asciicast inválido: ${e.message}`);
  }

  const events = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const ev = JSON.parse(line);
      if (Array.isArray(ev) && typeof ev[0] === 'number') {
        events.push(ev);
      }
    } catch {}
  }

  const lastEvent = events[events.length - 1];
  const duration = lastEvent ? Number(lastEvent[0].toFixed(2)) : 0;

  return {
    id: `cast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    header,
    events,
    duration,
    createdAt: header.timestamp ? new Date(header.timestamp * 1000).toISOString() : new Date().toISOString(),
    eventCount: events.length
  };
}

/**
 * Converte a gravação para o formato padrão Asciicast v2 (.cast)
 */
export function formatAsAsciicast(recording) {
  if (!recording || !recording.header) return '';
  const headerLine = JSON.stringify(recording.header);
  const eventLines = (recording.events || []).map((e) => JSON.stringify(e));
  return [headerLine, ...eventLines].join('\n') + '\n';
}

/**
 * Faz download de um arquivo .cast pronto para o asciinema player
 */
export function downloadCastFile(recording, filename = 'termius-session.cast') {
  const content = formatAsAsciicast(recording);
  const blob = new Blob([content], { type: 'application/x-asciicast;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.cast') ? filename : `${filename}.cast`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
