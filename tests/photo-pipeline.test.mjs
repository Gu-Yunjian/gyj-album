import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pipelinePath = path.join(repoRoot, 'scripts', 'process_photos.py');

const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

test('photo processing preserves albums that are not present in this originals scan', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gu-album-pipeline-'));

  try {
    await fs.mkdir(path.join(tempDir, 'originals', 'update'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'public'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'originals', 'update', 'new.png'),
      ONE_PIXEL_PNG
    );
    await fs.writeFile(
      path.join(tempDir, 'public', 'albums.json'),
      JSON.stringify({
        albums: [
          {
            name: 'keep',
            title: 'Keep me',
            subtitle: '',
            cover: 'old.webp',
            photos: ['old.webp'],
            photoInfos: {},
            hasBgm: false,
            order: 0,
          },
        ],
        allPhotos: {
          'keep/old': {
            id: 'keep/old',
            filename: 'old.webp',
            originalName: 'old.jpg',
            order: 0,
          },
        },
      })
    );

    await execFileAsync('python3', [pipelinePath], { cwd: tempDir });

    const result = JSON.parse(
      await fs.readFile(path.join(tempDir, 'public', 'albums.json'), 'utf8')
    );

    assert.deepEqual(
      result.albums.map((album) => album.name),
      ['keep', 'update']
    );
    assert.equal(result.allPhotos['keep/old'].filename, 'old.webp');
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
