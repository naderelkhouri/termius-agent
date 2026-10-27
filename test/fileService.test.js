import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { 
  formatPermissions, 
  formatBytes, 
  getBreadcrumbs, 
  listDirectory, 
  readFileContent, 
  writeFileContent, 
  createDirectory, 
  createFile, 
  deletePath, 
  renamePath 
} from '../server/fileService.js';

test('formatPermissions should convert octal mode to unix string', () => {
  // 0o755 directory -> drwxr-xr-x
  const dirMode = 0o040755;
  assert.equal(formatPermissions(dirMode), 'drwxr-xr-x');

  // 0o644 regular file -> -rw-r--r--
  const fileMode = 0o100644;
  assert.equal(formatPermissions(fileMode), '-rw-r--r--');

  // fallback for non-number
  assert.equal(formatPermissions(null), '---------');
});

test('formatBytes should format size correctly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(1048576), '1 MB');
  assert.equal(formatBytes(1073741824), '1 GB');
});

test('getBreadcrumbs should decompose paths correctly', () => {
  const breadcrumbs = getBreadcrumbs('/home/nader/Applications/termius-agent');
  assert.equal(breadcrumbs[0].label, 'Raiz (/)');
  assert.equal(breadcrumbs[0].path, '/');
  assert.equal(breadcrumbs[1].label, 'home');
  assert.equal(breadcrumbs[1].path, '/home');
  assert.equal(breadcrumbs[breadcrumbs.length - 1].label, 'termius-agent');
  assert.equal(breadcrumbs[breadcrumbs.length - 1].path, '/home/nader/Applications/termius-agent');
});

test('listDirectory should list items in a real directory with metadata', async () => {
  const result = await listDirectory('/home/nader/Applications/termius-agent');
  assert.ok(!result.error, 'Should not return an error');
  assert.equal(typeof result.totalItems, 'number');
  assert.ok(result.totalItems > 0);
  assert.ok(Array.isArray(result.items));
  
  // Folders should come first
  const firstFileIdx = result.items.findIndex(i => !i.isDirectory);
  const lastFolderIdx = result.items.findLastIndex(i => i.isDirectory);
  if (firstFileIdx !== -1 && lastFolderIdx !== -1) {
    assert.ok(firstFileIdx > lastFolderIdx, 'Folders must precede files');
  }

  // Check metadata keys
  const item = result.items[0];
  assert.ok('name' in item);
  assert.ok('path' in item);
  assert.ok('isDirectory' in item);
  assert.ok('isFile' in item);
  assert.ok('permissions' in item);
  assert.ok('sizeFormatted' in item);
});

test('file operations: create, read, write, rename, delete', async () => {
  const tmpDir = path.join(os.tmpdir(), `termius-test-${Date.now()}`);
  await createDirectory(tmpDir);

  const testFile = path.join(tmpDir, 'test.txt');
  await createFile(testFile, 'Hello Termius Agent');

  const readResult = await readFileContent(testFile);
  assert.equal(readResult.content, 'Hello Termius Agent');
  assert.equal(readResult.isBinary, false);

  // Write new content
  await writeFileContent(testFile, 'Updated Content 123');
  const readUpdated = await readFileContent(testFile);
  assert.equal(readUpdated.content, 'Updated Content 123');

  // Rename
  const renamedFile = path.join(tmpDir, 'renamed.txt');
  await renamePath(testFile, renamedFile);
  assert.ok(!fs.existsSync(testFile));
  assert.ok(fs.existsSync(renamedFile));

  // Clean up
  await deletePath(tmpDir);
  assert.ok(!fs.existsSync(tmpDir));
});

test('deletePath should prevent deleting protected paths', async () => {
  await assert.rejects(
    async () => {
      await deletePath('/');
    },
    { message: /Operação bloqueada/ }
  );

  await assert.rejects(
    async () => {
      await deletePath('/home');
    },
    { message: /Operação bloqueada/ }
  );
});
