import { recordTelemetryEvent } from './api';

let isInitialized = false;

export function initGlobalTelemetry() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  window.addEventListener('error', (event) => {
    try {
      recordTelemetryEvent({
        type: 'bug',
        title: `Erro de Script: ${event.message || 'Erro Desconhecido'}`,
        message: `${event.filename}:${event.lineno}:${event.colno}`,
        stack: event.error?.stack || null,
        severity: 'high',
        source: 'browser_window',
        category: 'frontend_runtime',
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      }).catch(() => {});
    } catch {}
  });

  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      recordTelemetryEvent({
        type: 'bug',
        title: `Promise Rejeitada: ${reason?.message || String(reason)}`,
        message: 'Promessa assíncrona rejeitada sem catch no cliente.',
        stack: reason?.stack || null,
        severity: 'medium',
        source: 'unhandled_rejection',
        category: 'async_runtime',
        metadata: {
          url: window.location.href
        }
      }).catch(() => {});
    } catch {}
  });

  console.log('✔ [Telemetry] Rastreador global de bugs e telemetria ativado.');
}

export async function logBug(title, message, error = null, severity = 'medium', metadata = {}) {
  try {
    return await recordTelemetryEvent({
      type: 'bug',
      title,
      message,
      stack: error?.stack || null,
      severity,
      source: 'manual_report',
      category: 'user_reported',
      metadata
    });
  } catch (e) {
    console.warn('[Telemetry] Falha ao reportar bug:', e);
  }
}

export async function submitManualImprovement({ title, message, category = 'ui', severity = 'low' }) {
  return await recordTelemetryEvent({
    type: 'manual_improvement',
    title,
    message,
    severity,
    source: 'user_feedback',
    category,
    status: 'open'
  });
}
