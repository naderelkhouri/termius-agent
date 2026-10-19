import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HOME_DIR = process.env.HOME || os.homedir();
const CLI_BASE_PATH = path.join(HOME_DIR, '.gemini/antigravity-cli');
const DB_PATH = path.join(CLI_BASE_PATH, 'conversation_summaries.db');
const BRAIN_PATH = path.join(CLI_BASE_PATH, 'brain');
const HISTORY_PATH = path.join(CLI_BASE_PATH, 'history.jsonl');

let cachedDb = null;

export function getDbConnection() {
  if (cachedDb) return cachedDb;
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database file not found at ${DB_PATH}`);
  }
  cachedDb = new DatabaseSync(DB_PATH, { open: true, readOnly: true });
  return cachedDb;
}

export function listConversations({ search = '', limit = 50, offset = 0 } = {}) {
  const db = getDbConnection();
  let query = `
    SELECT 
      conversation_id, 
      title, 
      preview, 
      step_count, 
      last_modified_time, 
      last_user_input_time,
      status,
      workspace_uris
    FROM conversation_summaries
    WHERE (nesting_depth = 0 OR nesting_depth IS NULL)
  `;
  const params = [];

  if (search && search.trim()) {
    query += ` AND (title LIKE ? OR preview LIKE ?)`;
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  query += ` ORDER BY last_modified_time DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);

  const formattedRows = rows.map((r) => {
    let workspace = '/home/nader';
    if (r.workspace_uris) {
      try {
        const uris = JSON.parse(r.workspace_uris);
        if (Array.isArray(uris) && uris[0]) {
          const clean = uris[0].replace(/^file:\/\//, '');
          if (clean.startsWith('/')) workspace = clean;
        }
      } catch {}
    }
    return {
      ...r,
      workspace
    };
  });

  // Total count
  let countQuery = `SELECT count(*) as total FROM conversation_summaries WHERE (nesting_depth = 0 OR nesting_depth IS NULL)`;
  const countParams = [];
  if (search && search.trim()) {
    countQuery += ` AND (title LIKE ? OR preview LIKE ?)`;
    countParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }
  const countStmt = db.prepare(countQuery);
  const total = countStmt.get(...countParams).total;

  return { conversations: formattedRows, total };
}

export function getConversationTranscript(conversationId) {
  if (!conversationId || typeof conversationId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(conversationId)) {
    return { error: 'Identificador de conversa inválido', steps: [] };
  }

  const transcriptPath = path.join(BRAIN_PATH, conversationId, '.system_generated/logs/transcript.jsonl');
  if (!fs.existsSync(transcriptPath)) {
    return { error: 'Transcript file not found for this conversation', steps: [] };
  }

  const content = fs.readFileSync(transcriptPath, 'utf-8');
  const lines = content.trim().split('\n');
  const steps = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      steps.push({
        stepIndex: parsed.step_index,
        source: parsed.source,
        type: parsed.type,
        status: parsed.status,
        createdAt: parsed.created_at,
        content: parsed.content || '',
        toolCalls: parsed.tool_calls || [],
        thinking: parsed.thinking || null,
      });
    } catch (err) {
      // ignore corrupt lines
    }
  }

  return { conversationId, steps };
}

export function getRecentHistoryPrompts(limit = 30) {
  if (!fs.existsSync(HISTORY_PATH)) {
    return [];
  }
  const content = fs.readFileSync(HISTORY_PATH, 'utf-8');
  const lines = content.trim().split('\n');
  const prompts = [];

  for (let i = lines.length - 1; i >= 0 && prompts.length < limit; i--) {
    const line = lines[i];
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      prompts.push(parsed);
    } catch {
      // ignore
    }
  }

  return prompts;
}
