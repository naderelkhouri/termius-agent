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
    header: session.header,
    events: session.events,
    duration: Number(duration.toFixed(2)),
    createdAt: new Date(session.startTime).toISOString(),
    eventCount: session.events.length
  };

  return result;
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
