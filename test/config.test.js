import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { resolveSessionSecret } from '../backend/config.js';

test('production requires a configured session secret', () => {
  for (const env of [
    { NODE_ENV: 'production' },
    { NODE_ENV: 'production', SESSION_SECRET: '' },
    { NODE_ENV: 'production', SESSION_SECRET: '   ' }
  ]) {
    assert.throws(() => resolveSessionSecret(env), /non-placeholder value of at least 32 characters/);
  }
});

test('production rejects short and known placeholder secrets', () => {
  const invalidSecrets = [
    'x'.repeat(31),
    'development-only-qba-session-secret-change-me',
    'replace-with-a-long-random-secret',
    '  REPLACE-WITH-A-LONG-RANDOM-SECRET  '
  ];

  for (const secret of invalidSecrets) {
    assert.throws(
      () => resolveSessionSecret({ NODE_ENV: 'production', SESSION_SECRET: secret }),
      error => {
        assert.match(error.message, /non-placeholder value of at least 32 characters/);
        assert.equal(error.message.includes(secret), false);
        return true;
      }
    );
  }
});

test('production accepts a sufficiently long configured secret without rewriting it', () => {
  const minimumLengthSecret = 's'.repeat(32);
  assert.equal(resolveSessionSecret({ NODE_ENV: 'production', SESSION_SECRET: minimumLengthSecret }), minimumLengthSecret);

  const secret = ` ${'s'.repeat(32)} `;
  assert.equal(resolveSessionSecret({ NODE_ENV: 'production', SESSION_SECRET: secret }), secret);
});

test('non-production environments retain the local fallback and accept configured secrets', () => {
  assert.equal(resolveSessionSecret({ NODE_ENV: 'development' }), 'development-only-qba-session-secret-change-me');
  const secret = 'local test secret';
  assert.equal(resolveSessionSecret({ NODE_ENV: 'test', SESSION_SECRET: secret }), secret);
});

test('production startup rejects a missing secret before creating or migrating SQLite', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qba-secret-config-'));
  const databasePath = path.join(directory, 'must-not-be-created.sqlite');
  const dotenvPath = path.join(directory, 'empty.env');
  fs.writeFileSync(dotenvPath, '');
  const env = { ...process.env };
  delete env.SESSION_SECRET;
  Object.assign(env, {
    NODE_ENV: 'production',
    DATABASE_PATH: databasePath,
    DOTENV_CONFIG_PATH: dotenvPath
  });

  try {
    const result = spawnSync(process.execPath, ['backend/server.js'], {
      cwd: process.cwd(), env, encoding: 'utf8', timeout: 5000
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    assert.notEqual(result.status, 0, 'server should refuse production startup without a secret');
    assert.match(output, /Production requires SESSION_SECRET/);
    assert.equal(fs.existsSync(databasePath), false, 'database must not be opened before configuration validation');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
