import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  detectConversationWorkspace,
  generateSpecAndRoadmap,
  updateSpecAndRoadmap,
  exportSpecAndRoadmapToMarkdown
} from '../server/specRoadmapService.js';

test('specRoadmapService should detect explicit workspace correctly', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'termius-spec-test-'));
  try {
    const ws = detectConversationWorkspace('fake-conv-id', tmpDir);
    assert.equal(ws, tmpDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('generateSpecAndRoadmap should read real SPEC.md and ROADMAP.md if they exist', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'termius-spec-test-'));
  try {
    const testSpecContent = '# Especificação do Projeto Teste\n\nDetalhes do projeto aqui.';
    const testRoadmapContent = '# Roadmap do Projeto Teste\n\n- [x] Item 1\n- [ ] Item 2';
    
    fs.writeFileSync(path.join(tmpDir, 'SPEC.md'), testSpecContent, 'utf-8');
    fs.writeFileSync(path.join(tmpDir, 'ROADMAP.md'), testRoadmapContent, 'utf-8');

    const result = generateSpecAndRoadmap('dummy-conv', tmpDir);

    assert.equal(result.workspace, tmpDir);
    assert.equal(result.hasRealSpec, true);
    assert.equal(result.hasRealRoadmap, true);
    assert.equal(result.rawSpecContent, testSpecContent);
    assert.equal(result.rawRoadmapContent, testRoadmapContent);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('updateSpecAndRoadmap should persist updated markdown to disk', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'termius-spec-test-'));
  try {
    const updatedSpec = '# Novo SPEC Atualizado\n\nTexto modificado pelo editor.';
    const updatedRoadmap = '# Novo Roadmap Atualizado\n\n- [x] Concluído';

    const result = updateSpecAndRoadmap('dummy-conv', {
      workspace: tmpDir,
      specContent: updatedSpec,
      roadmapContent: updatedRoadmap
    });

    assert.equal(fs.readFileSync(path.join(tmpDir, 'SPEC.md'), 'utf-8'), updatedSpec);
    assert.equal(fs.readFileSync(path.join(tmpDir, 'ROADMAP.md'), 'utf-8'), updatedRoadmap);
    assert.equal(result.hasRealSpec, true);
    assert.equal(result.rawSpecContent, updatedSpec);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
