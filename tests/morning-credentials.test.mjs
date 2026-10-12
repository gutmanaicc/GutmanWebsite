import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMorningCredentials } from '../server/morning-credentials.mjs';

test('Morning credential lookup never enumerates keychain or sends credentials as arguments', () => {
  const calls = [];
  const execute = (file, args, options) => {
    calls.push({ file, args, options });
    if (args[2] !== 'Morning') throw new Error('not found');
    return JSON.stringify({ id: 'private-id', secret: 'private-secret' }) + '\n';
  };
  const result = loadMorningCredentials({ env: {}, platform: 'darwin', execute });
  assert.equal(result.secret, 'private-secret');
  assert.equal(calls.length, 6);
  for (const call of calls) {
    assert.equal(call.file, '/usr/bin/security');
    assert.deepEqual(call.options.stdio, ['ignore', 'pipe', 'pipe']);
    assert.equal(call.args[0], 'find-generic-password');
    assert.ok(!call.args.includes('private-secret'));
  }
});

test('Morning lookup uses precise separate items and refuses ambiguous, malformed or inaccessible credentials', () => {
  const pair = loadMorningCredentials({ env: {}, platform: 'darwin', idService: 'academy-id', secretService: 'academy-secret', account: 'owner', execute: (_file, args) => {
    assert.deepEqual(args.slice(3), ['-a', 'owner', '-w']);
    return args[2] === 'academy-id' ? 'id-value\n' : 'secret-value\n';
  } });
  assert.equal(pair.id, 'id-value');
  assert.equal(pair.secret, 'secret-value');
  assert.throws(() => loadMorningCredentials({ env: {}, platform: 'linux' }), /local Mac/);
  assert.throws(() => loadMorningCredentials({ env: { MORNING_API_ID: 'one' }, platform: 'linux' }), /Both/);
  assert.throws(() => loadMorningCredentials({ env: {}, platform: 'darwin', execute: () => '{"id":"a","secret":"b"}' }), /Multiple/);
  assert.throws(() => loadMorningCredentials({ env: {}, platform: 'darwin', service: 'Morning', execute: () => 'unprintable-private-value' }), error => !error.message.includes('unprintable-private-value'));
});
