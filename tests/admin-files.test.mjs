import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { parseDeletePhotoRequest } from '../src/lib/admin-files.ts';

test('photo deletion accepts album and filename in a JSON request body', async () => {
  const request = new Request('http://localhost/api/admin/files', {
    method: 'DELETE',
    body: JSON.stringify({
      album: 'journal',
      filename: 'photo.webp',
    }),
  });

  assert.deepEqual(await parseDeletePhotoRequest(request), {
    album: 'journal',
    filename: 'photo.webp',
  });
});

test('admin sends photo deletion parameters in the request body', async () => {
  const source = await fs.readFile(
    new URL('../src/app/admin/page.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /method:\s*['"]DELETE['"]/);
  assert.match(source, /body:\s*JSON\.stringify\(\{\s*album:\s*albumName,\s*filename/);
});
