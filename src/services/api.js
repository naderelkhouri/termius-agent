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
