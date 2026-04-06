import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MODE,
  getLatestModeFromBranch,
  getSkillPathsForMode,
  createModeEntry,
  parseSuperCommandArgs,
} from '../../extensions/pi-superpowers.ts';

test('getLatestModeFromBranch defaults to normal when no mode entry exists', () => {
  assert.equal(getLatestModeFromBranch([]), DEFAULT_MODE);
});

test('getLatestModeFromBranch returns the latest persisted mode entry', () => {
  const branch = [
    { type: 'custom', customType: 'superpowers-mode', data: { mode: 'normal', changedAt: 1 } },
    { type: 'custom', customType: 'superpowers-mode', data: { mode: 'super', changedAt: 2 } },
  ];

  assert.equal(getLatestModeFromBranch(branch), 'super');
});

test('getSkillPathsForMode exposes skills only in super mode', () => {
  assert.deepEqual(getSkillPathsForMode('normal', '/repo/skills'), []);
  assert.deepEqual(getSkillPathsForMode('super', '/repo/skills'), ['/repo/skills']);
});

test('parseSuperCommandArgs preserves empty invocation and inline prompt', () => {
  assert.deepEqual(parseSuperCommandArgs(''), { mode: 'super', prompt: null });
  assert.deepEqual(parseSuperCommandArgs('fix this bug'), { mode: 'super', prompt: 'fix this bug' });
});

test('createModeEntry stamps a mode change entry', () => {
  const entry = createModeEntry('super', 123);
  assert.equal(entry.customType, 'superpowers-mode');
  assert.deepEqual(entry.data, { mode: 'super', changedAt: 123 });
});

import superpowersForPi from '../../extensions/pi-superpowers.ts';

function createFakePi() {
  const handlers = new Map();
  const commands = new Map();
  const entries = [];

  return {
    handlers,
    commands,
    entries,
    sentMessages: [],
    on(name, handler) {
      handlers.set(name, handler);
    },
    registerCommand(name, spec) {
      commands.set(name, spec);
    },
    appendEntry(customType, data) {
      entries.push({ customType, data });
    },
    sendUserMessage(message) {
      this.sentMessages.push(message);
    },
  };
}

test('resources_discover returns no skill paths in normal mode', async () => {
  const pi = createFakePi();
  superpowersForPi(pi);

  const result = await pi.handlers.get('resources_discover')({}, {
    sessionManager: { getBranch: () => [] },
    ui: { setStatus() {} },
  });

  assert.deepEqual(result.skillPaths ?? [], []);
});

test('before_agent_start injects bootstrap only in super mode', async () => {
  const pi = createFakePi();
  superpowersForPi(pi);

  const normalResult = await pi.handlers.get('before_agent_start')({}, {
    sessionManager: { getBranch: () => [] },
    ui: { setStatus() {} },
  });

  assert.equal(normalResult, undefined);
});

function createFakeCommandContext(branch = []) {
  return {
    reloaded: false,
    sentMessages: [],
    sessionManager: { getBranch: () => branch },
    ui: { setStatus() {} },
    async reload() {
      this.reloaded = true;
    },
  };
}

test('extension registers /super and /normal commands', () => {
  const pi = createFakePi();
  superpowersForPi(pi);

  assert.ok(pi.commands.has('super'));
  assert.ok(pi.commands.has('normal'));
});

test('/super appends super mode entry and reloads', async () => {
  const pi = createFakePi();
  superpowersForPi(pi);
  const ctx = createFakeCommandContext();

  await pi.commands.get('super').handler('fix this bug', ctx);

  assert.equal(pi.entries[0].customType, 'superpowers-mode');
  assert.equal(pi.entries[0].data.mode, 'super');
  assert.equal(ctx.reloaded, true);
});

test('session_start forwards one pending prompt after super-mode reload', async () => {
  const pi = createFakePi();
  superpowersForPi(pi);

  const branch = [
    { type: 'custom', customType: 'superpowers-mode', data: { mode: 'super', changedAt: 10 } },
    { type: 'custom', customType: 'superpowers-pending-prompt', data: { text: 'fix this bug', createdAt: 11 } },
  ];

  await pi.handlers.get('session_start')({}, {
    sessionManager: { getBranch: () => branch },
    ui: { setStatus() {} },
  });

  assert.deepEqual(pi.sentMessages, ['fix this bug']);
  assert.equal(pi.entries.at(-1).customType, 'superpowers-pending-prompt-consumed');
});
