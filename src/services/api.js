const BASE_URL = '/api';

export async function fetchFavorites() {
  try {
    const res = await fetch(`${BASE_URL}/conversations/favorites`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function addFavorite(conversationId) {
  const res = await fetch(`${BASE_URL}/conversations/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId })
  });
  if (!res.ok) throw new Error('Falha ao adicionar favorito');
  return res.json();
}

export async function removeFavorite(conversationId) {
  const res = await fetch(`${BASE_URL}/conversations/favorites/${conversationId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Falha ao remover favorito');
  return res.json();
}

export async function fetchFluidConversations() {
  try {
    const res = await fetch(`${BASE_URL}/conversations/fluid`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function addFluidConversation(conversationId) {
  const res = await fetch(`${BASE_URL}/conversations/fluid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId })
  });
  if (!res.ok) throw new Error('Falha ao ativar modo fluido');
  return res.json();
}

export async function removeFluidConversation(conversationId) {
  const res = await fetch(`${BASE_URL}/conversations/fluid/${conversationId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Falha ao desativar modo fluido');
  return res.json();
}

export async function fetchConversations({ search = '', limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({ search, limit, offset });
  const res = await fetch(`${BASE_URL}/conversations?${params}`);
  if (!res.ok) throw new Error('Falha ao buscar conversas');
  return res.json();
}

export async function fetchTranscript(conversationId) {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/transcript`);
  if (!res.ok) throw new Error('Falha ao carregar transcript');
  return res.json();
}

export async function fetchHistory(limit = 30) {
  const res = await fetch(`${BASE_URL}/history?limit=${limit}`);
  if (!res.ok) throw new Error('Falha ao buscar histórico recente');
  return res.json();
}

export async function fetchHosts() {
  const res = await fetch(`${BASE_URL}/hosts`);
  if (!res.ok) throw new Error('Falha ao carregar hosts');
  return res.json();
}

export async function createHost(hostData) {
  const res = await fetch(`${BASE_URL}/hosts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(hostData)
  });
  if (!res.ok) throw new Error('Falha ao salvar host');
  return res.json();
}

export async function deleteHost(id) {
  const res = await fetch(`${BASE_URL}/hosts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir host');
  return res.json();
}

export async function fetchSnippets() {
  const res = await fetch(`${BASE_URL}/snippets`);
  if (!res.ok) throw new Error('Falha ao carregar snippets');
  return res.json();
}

export async function createSnippet(snippetData) {
  const res = await fetch(`${BASE_URL}/snippets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snippetData)
  });
  if (!res.ok) throw new Error('Falha ao salvar snippet');
  return res.json();
}

export async function deleteSnippet(id) {
  const res = await fetch(`${BASE_URL}/snippets/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir snippet');
  return res.json();
}

export async function fetchCopilotSuggestion(query, cwd) {
  const res = await fetch(`${BASE_URL}/copilot/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, cwd })
  });
  if (!res.ok) throw new Error('Falha ao obter sugestão do Copilot');
  return res.json();
}

export async function fetchTelemetryMetrics() {
  const res = await fetch(`${BASE_URL}/telemetry/metrics`);
  if (!res.ok) throw new Error('Falha ao carregar métricas de telemetria');
  return res.json();
}

export async function fetchTelemetryEvents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.severity) params.append('severity', filters.severity);
  if (filters.limit) params.append('limit', filters.limit);

  const res = await fetch(`${BASE_URL}/telemetry/events?${params}`);
  if (!res.ok) throw new Error('Falha ao carregar eventos de telemetria');
  return res.json();
}

export async function recordTelemetryEvent(eventData) {
  const res = await fetch(`${BASE_URL}/telemetry/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  });
  if (!res.ok) throw new Error('Falha ao registrar evento de telemetria');
  return res.json();
}

export async function updateTelemetryEvent(id, updates) {
  const res = await fetch(`${BASE_URL}/telemetry/events/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Falha ao atualizar evento de telemetria');
  return res.json();
}

export async function deleteTelemetryEvent(id) {
  const res = await fetch(`${BASE_URL}/telemetry/events/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Falha ao excluir evento de telemetria');
  return res.json();
}

export async function triggerAutomatedAnalysis() {
  const res = await fetch(`${BASE_URL}/telemetry/improvements/analyze`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Falha ao rodar análise automatizada');
  return res.json();
}

export async function fetchCommandSuggestions(query = '', cwd = '', category = 'all') {
  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (cwd) params.append('cwd', cwd);
    if (category && category !== 'all') params.append('category', category);
    const res = await fetch(`${BASE_URL}/commands/suggestions?${params}`);
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error('[API] Erro ao buscar sugestões de comandos:', err);
    return [];
  }
}

export async function fetchSkills(search = '', category = 'all') {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'all') params.append('category', category);
    const res = await fetch(`${BASE_URL}/skills?${params}`);
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error('[API] Erro ao carregar skills:', err);
    return [];
  }
}

export async function fetchSkillDetail(name) {
  const res = await fetch(`${BASE_URL}/skills/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Falha ao carregar detalhes da skill');
  return res.json();
}

export async function fetchSpecAndRoadmap(conversationId) {
  const res = await fetch(`${BASE_URL}/conversations/${encodeURIComponent(conversationId)}/spec-roadmap`);
  if (!res.ok) throw new Error('Falha ao carregar spec e roadmap da conversa');
  return res.json();
}

export async function saveSpecAndRoadmap(conversationId, data) {
  const res = await fetch(`${BASE_URL}/conversations/${encodeURIComponent(conversationId)}/spec-roadmap`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Falha ao atualizar spec e roadmap');
  return res.json();
}

export async function exportSpecAndRoadmap(conversationId, options = {}) {
  const res = await fetch(`${BASE_URL}/conversations/${encodeURIComponent(conversationId)}/export-spec-roadmap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function pingHost(address, port = 22, timeout = 2500) {
  try {
    const res = await fetch(`${BASE_URL}/hosts/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, port, timeout })
    });
    if (!res.ok) {
      return { online: false, error: `HTTP ${res.status}` };
    }
    return res.json();
  } catch (err) {
    return { online: false, error: err.message };
  }
}

export async function fetchSystemStatus() {
  try {
    const res = await fetch(`${BASE_URL}/system/status`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ==========================================
// File Manager & SFTP Remote File API Client
// ==========================================

export async function fetchFsList(dirPath = '', showHidden = false) {
  const params = new URLSearchParams();
  if (dirPath) params.append('path', dirPath);
  if (showHidden) params.append('showHidden', 'true');

  const res = await fetch(`${BASE_URL}/fs/list?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchFsReadFile(filePath) {
  const params = new URLSearchParams({ path: filePath });
  const res = await fetch(`${BASE_URL}/fs/read?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export async function saveFsFile(filePath, content) {
  const res = await fetch(`${BASE_URL}/fs/write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, content })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export async function createFsDirectory(dirPath) {
  const res = await fetch(`${BASE_URL}/fs/mkdir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: dirPath })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export async function createFsFile(filePath, content = '') {
  const res = await fetch(`${BASE_URL}/fs/touch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, content })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteFsPath(targetPath) {
  const res = await fetch(`${BASE_URL}/fs/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: targetPath })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export async function renameFsPath(oldPath, newPath) {
  const res = await fetch(`${BASE_URL}/fs/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPath, newPath })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchRemoteFsList(hostId, remotePath = '', showHidden = false) {
  const res = await fetch(`${BASE_URL}/fs/remote/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostId, remotePath, showHidden })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${res.status}`);
  }
  return res.json();
}
