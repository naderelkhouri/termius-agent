/**
 * Serviço de Notificações Desktop Nativas e Chime de Áudio Suave
 * Termius Agent Suite
 */

let audioCtx = null;

export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Acorde harmônico suave de dois tons: 587.33Hz (D5) para 880Hz (A5)
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now + 0.04);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch (err) {
    console.debug('[NotificationSound] AudioContext não inicializado:', err);
  }
}

export function isNotificationEnabled() {
  try {
    const stored = localStorage.getItem('termius_notifications_enabled');
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function setNotificationEnabled(enabled) {
  try {
    localStorage.setItem('termius_notifications_enabled', String(enabled));
  } catch {}
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/**
 * Dispara uma notificação nativa no desktop e/ou navegador
 */
export function sendNotification({ title, body, sound = true }) {
  if (!isNotificationEnabled()) return;

  if (sound) {
    playNotificationSound();
  }

  // 1. Electron Desktop IPC
  if (window.electronAPI && typeof window.electronAPI.notify === 'function') {
    try {
      window.electronAPI.notify({ title, body, silent: true });
      return;
    } catch (e) {
      console.debug('[Notification] Falha ao enviar via Electron:', e);
    }
  }

  // 2. Web Notification API padrão
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        silent: true
      });
      notif.onclick = () => {
        window.focus();
        if (window.electronAPI && typeof window.electronAPI.focusWindow === 'function') {
          window.electronAPI.focusWindow();
        }
      };
      return;
    } catch (e) {
      console.debug('[Notification] Falha ao enviar via Web Notification:', e);
    }
  }

  // 3. Fallback no backend via notify-send (Linux)
  try {
    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body })
    }).catch(() => {});
  } catch {}
}
