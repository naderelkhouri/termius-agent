// Serviço unificado de Área de Transferência (Clipboard) com suporte a Electron e Navegador

export async function copyToClipboard(text) {
  if (!text) return false;

  // 1. Electron Desktop Nativo (Sem restrições de permissão/Wayland)
  if (window.electronAPI?.clipboard?.writeText) {
    try {
      window.electronAPI.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('[Clipboard] Erro via Electron API:', e);
    }
  }

  // 2. Clipboard API Web Padrão
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('[Clipboard] Erro via navigator.clipboard:', e);
    }
  }

  // 3. Fallback clássico via textarea invisível
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.width = '1px';
    ta.style.height = '1px';
    ta.style.padding = '0';
    ta.style.border = 'none';
    ta.style.outline = 'none';
    ta.style.boxShadow = 'none';
    ta.style.background = 'transparent';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    return success;
  } catch (err) {
    console.error('[Clipboard] Falha total no fallback de cópia:', err);
    return false;
  }
}

export async function readFromClipboard() {
  // 1. Electron Desktop Nativo
  if (window.electronAPI?.clipboard?.readText) {
    try {
      const text = await window.electronAPI.clipboard.readText();
      if (typeof text === 'string') return text;
    } catch (e) {
      console.warn('[Clipboard] Erro ao ler via Electron API:', e);
    }
  }

  // 2. Clipboard API Web Padrão
  if (navigator.clipboard?.readText) {
    try {
      const text = await navigator.clipboard.readText();
      if (typeof text === 'string') return text;
    } catch (e) {
      console.warn('[Clipboard] Erro ao ler via navigator.clipboard:', e);
    }
  }

  return '';
}
