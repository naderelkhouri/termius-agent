import test from 'node:test';
import assert from 'node:assert/strict';
import { listConversations, updateConversationTitle } from '../server/db.js';

test('listConversations should return formatted conversations list', () => {
  const result = listConversations({ limit: 5 });
  assert.ok(result);
  assert.ok(Array.isArray(result.conversations));
  assert.ok(typeof result.total === 'number');

  if (result.conversations.length > 0) {
    const conv = result.conversations[0];
    assert.ok('conversation_id' in conv);
    assert.ok('title' in conv);
    assert.ok('step_count' in conv);
    assert.ok('workspace' in conv);
  }
});

test('listConversations should apply customTitles override', () => {
  const initial = listConversations({ limit: 5 });
  if (initial.conversations.length === 0) return;

  const targetConv = initial.conversations[0];
  const customTitle = 'Nome Customizado de Teste 123';

  const withOverride = listConversations({
    limit: 5,
    customTitles: {
      [targetConv.conversation_id]: customTitle
    }
  });

  const modified = withOverride.conversations.find(c => c.conversation_id === targetConv.conversation_id);
  assert.ok(modified, 'Target conversation must be found');
  assert.equal(modified.title, customTitle);
});

test('updateConversationTitle should update SQLite title', () => {
  const initial = listConversations({ limit: 1 });
  if (initial.conversations.length === 0) return;

  const targetId = initial.conversations[0].conversation_id;
  const originalTitle = initial.conversations[0].title;
  const newTitle = 'Título Verificado SQLite';

  const updateSuccess = updateConversationTitle(targetId, newTitle);
  assert.equal(updateSuccess, true);

  const updatedList = listConversations({ limit: 1 });
  assert.equal(updatedList.conversations[0].title, newTitle);

  // Restore original title
  updateConversationTitle(targetId, originalTitle);
  const restoredList = listConversations({ limit: 1 });
  assert.equal(restoredList.conversations[0].title, originalTitle);
});
