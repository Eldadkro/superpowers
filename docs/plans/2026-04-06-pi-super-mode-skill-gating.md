# Pi Super Mode Skill Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan iteratively. Steps use checkbox (`- [ ]`) syntax for tracking so work can resume cleanly after context resets.

**Goal:** Refactor the Pi extension so Superpowers skills and bootstrap instructions are unavailable in normal mode and become available only after `/super`, remaining active until `/normal` or a new session.

**Architecture:** Move the Pi integration from an always-on bootstrap model to a session-mode model backed by persisted custom session entries. The extension will expose `skills/` only in `super` mode via `resources_discover`, inject `using-superpowers` only in `super` mode, and register `/super` and `/normal` commands that persist mode changes, reload Pi resources, and restore UI state safely.

**Tech Stack:** Pi extension API, TypeScript/ESM extension code, Node.js built-in test runner, Markdown docs

---

## File structure

- Modify: `extensions/pi-superpowers.ts` — replace one-shot bootstrap logic with mode-aware state restoration, dynamic resource discovery, command registration, UI indicator handling, and conditional bootstrap injection
- Create: `tests/pi-superpowers/mode-state.test.mjs` — unit tests for mode restoration, resource gating, and queued follow-up task handoff helpers
- Create: `tests/pi-superpowers/bootstrap.test.mjs` — unit tests for bootstrap loading and Pi tool-mapping wrapper generation
- Create: `tests/pi-superpowers/README.md` — focused manual verification checklist for session/reload behavior that is hard to prove in pure unit tests
- Modify: `docs/README.pi.md` — document `/super`, `/normal`, normal-mode behavior, and mode persistence semantics

The extension work should keep pure logic in small helper functions inside `extensions/pi-superpowers.ts` unless the file becomes unwieldy during implementation. The tests should target those pure helpers first, then manual verification should cover Pi runtime behaviors such as command-list updates after reload.

### Step 1: Extract and test pure mode/bootstrap helpers

**Files:**
- Modify: `extensions/pi-superpowers.ts`
- Create: `tests/pi-superpowers/mode-state.test.mjs`
- Create: `tests/pi-superpowers/bootstrap.test.mjs`

**Why this step matters:** The refactor hinges on deterministic helper behavior for mode restoration, skill-path gating, and bootstrap generation. Testing these first reduces risk before wiring them into Pi lifecycle events.

**Before editing, re-read:**
- `extensions/pi-superpowers.ts`
- `docs/superpowers/specs/2026-04-06-pi-super-mode-skill-gating-design.md`
- `docs/extensions.md` (Pi docs excerpt already consulted; re-open if lifecycle details are unclear)

- [x] **Write the failing test**

```javascript
// tests/pi-superpowers/mode-state.test.mjs
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
```

```javascript
// tests/pi-superpowers/bootstrap.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractAndStripFrontmatter,
  buildPiBootstrapMessage,
} from '../../extensions/pi-superpowers.ts';

test('extractAndStripFrontmatter removes YAML frontmatter and keeps body', () => {
  const input = `---\nname: using-superpowers\ndescription: demo\n---\n# Body\n`;
  const result = extractAndStripFrontmatter(input);

  assert.equal(result.content, '# Body\n');
  assert.equal(result.frontmatter.name, 'using-superpowers');
});

test('buildPiBootstrapMessage wraps stripped skill content with Pi tool mapping', () => {
  const message = buildPiBootstrapMessage('# Skill body');

  assert.match(message, /You have superpowers\./);
  assert.match(message, /\*\*Tool Mapping for Pi:\*\*/);
  assert.match(message, /# Skill body/);
});
```

- [x] **Run test to verify it fails**

Run: `node --test tests/pi-superpowers/mode-state.test.mjs tests/pi-superpowers/bootstrap.test.mjs`
Expected: FAIL with module export/import errors because the helper functions do not exist yet.

- [x] **Write minimal implementation**

Add named exports and helper functions to `extensions/pi-superpowers.ts` so they are testable without instantiating Pi. The implementation should define a single source of truth for mode names, state entry creation, branch restoration, skill-path exposure, frontmatter stripping, and bootstrap message construction.

```javascript
export const DEFAULT_MODE = 'normal';
export const SUPER_MODE = 'super';
export const MODE_ENTRY_TYPE = 'superpowers-mode';

export function createModeEntry(mode, changedAt = Date.now()) {
  return {
    customType: MODE_ENTRY_TYPE,
    data: { mode, changedAt },
  };
}

export function getLatestModeFromBranch(branch) {
  let mode = DEFAULT_MODE;

  for (const entry of branch) {
    if (entry.type === 'custom' && entry.customType === MODE_ENTRY_TYPE) {
      const candidate = entry.data?.mode;
      if (candidate === DEFAULT_MODE || candidate === SUPER_MODE) mode = candidate;
    }
  }

  return mode;
}

export function getSkillPathsForMode(mode, skillsPath) {
  return mode === SUPER_MODE ? [skillsPath] : [];
}

export function parseSuperCommandArgs(args) {
  const prompt = args.trim();
  return {
    mode: SUPER_MODE,
    prompt: prompt.length > 0 ? prompt : null,
  };
}

export function buildPiBootstrapMessage(skillBody) {
  return `<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - do NOT try to load \"using-superpowers\" again. Use skill loading only for other skills.**\n\n${skillBody}\n\n**Tool Mapping for Pi:**\nWhen skills reference tools you don't have, substitute Pi equivalents:\n- \`Skill\` tool → Skills are installed locally. Follow matching skills directly, or use \`/skill:name\` to force-load one.\n- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Use Pi's native tools.\n- \`TodoWrite\` → Pi has no built-in task tracker. Track checklist progress in the plan file or a local TODO.md.\n- \`Task\` tool with subagents → Pi has no built-in subagents. Work sequentially in this session unless the user installed a subagent extension/package.\n\nIf a superpowers skill assumes a missing Pi feature, preserve the workflow intent and use the closest native Pi mechanism.\n</EXTREMELY_IMPORTANT>`;
}
```

- [x] **Run test to verify it passes**

Run: `node --test tests/pi-superpowers/mode-state.test.mjs tests/pi-superpowers/bootstrap.test.mjs`
Expected: PASS

- [x] **Run broader verification for this step**

Run: `node --test tests/pi-superpowers/*.test.mjs`
Expected: PASS

- [x] **Commit checkpoint**

```bash
git add extensions/pi-superpowers.ts tests/pi-superpowers/mode-state.test.mjs tests/pi-superpowers/bootstrap.test.mjs
git commit -m "test(pi): cover super mode helper logic"
```

**Resume note:** After a context reset, find the first unchecked item above, re-read `extensions/pi-superpowers.ts` and the two test files, confirm the helper exports exist, then continue from the first incomplete checkbox.

### Step 2: Implement session mode restoration, skill gating, and bootstrap gating in the extension

**Files:**
- Modify: `extensions/pi-superpowers.ts`
- Test: `tests/pi-superpowers/mode-state.test.mjs`
- Test: `tests/pi-superpowers/bootstrap.test.mjs`

**Why this step matters:** This is the core behavior change: normal mode must expose no Superpowers resources, while super mode must expose all skills and inject bootstrap instructions.

**Before editing, re-read:**
- `extensions/pi-superpowers.ts`
- `docs/superpowers/specs/2026-04-06-pi-super-mode-skill-gating-design.md`
- `docs/README.pi.md`

- [x] **Write the failing test**

Add event-oriented tests that instantiate the extension with a fake Pi API and assert the registered handlers behave correctly.

```javascript
// append to tests/pi-superpowers/mode-state.test.mjs
import superpowersForPi from '../../extensions/pi-superpowers.ts';

function createFakePi() {
  const handlers = new Map();
  const commands = new Map();
  const entries = [];

  return {
    handlers,
    commands,
    entries,
    on(name, handler) {
      handlers.set(name, handler);
    },
    registerCommand(name, spec) {
      commands.set(name, spec);
    },
    appendEntry(customType, data) {
      entries.push({ customType, data });
    },
    sendUserMessage() {},
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
```

- [x] **Run test to verify it fails**

Run: `node --test tests/pi-superpowers/mode-state.test.mjs tests/pi-superpowers/bootstrap.test.mjs`
Expected: FAIL because the extension still uses the old one-shot bootstrap flow, registers no commands, and does not implement `resources_discover`.

- [x] **Write minimal implementation**

Refactor `extensions/pi-superpowers.ts` to:
- compute `skillsPath` once from `superpowersRoot`
- restore current mode from `ctx.sessionManager.getBranch()`
- keep a small in-memory `currentMode` synchronized on `session_start`
- register `resources_discover` and return `skillPaths: getSkillPathsForMode(currentMode, skillsPath)`
- remove the old `superpowers-bootstrap-installed` marker logic entirely
- register `before_agent_start` that injects bootstrap only when `currentMode === 'super'`
- restore/clear the UI indicator on `session_start` and after mode changes

```javascript
const skillsPath = path.join(superpowersRoot, 'skills');

function applyModeIndicator(ctx, mode) {
  if (mode === SUPER_MODE) ctx.ui.setStatus('superpowers-mode', 'SUPER ON');
  else ctx.ui.setStatus('superpowers-mode', '');
}

export default function superpowersForPi(pi) {
  let currentMode = DEFAULT_MODE;

  pi.on('session_start', async (_event, ctx) => {
    currentMode = getLatestModeFromBranch(ctx.sessionManager.getBranch());
    applyModeIndicator(ctx, currentMode);
  });

  pi.on('resources_discover', async () => ({
    skillPaths: getSkillPathsForMode(currentMode, skillsPath),
  }));

  pi.on('before_agent_start', async (_event, ctx) => {
    if (currentMode !== SUPER_MODE) return;

    const bootstrap = getBootstrapContent();
    if (!bootstrap) return;

    return {
      message: {
        customType: 'superpowers-bootstrap',
        content: bootstrap,
        display: false,
      },
    };
  });
}
```

- [x] **Run test to verify it passes**

Run: `node --test tests/pi-superpowers/mode-state.test.mjs tests/pi-superpowers/bootstrap.test.mjs`
Expected: PASS

- [x] **Run broader verification for this step**

Run: `node --test tests/pi-superpowers/*.test.mjs`
Expected: PASS

- [x] **Commit checkpoint**

```bash
git add extensions/pi-superpowers.ts tests/pi-superpowers/mode-state.test.mjs tests/pi-superpowers/bootstrap.test.mjs
git commit -m "feat(pi): gate skills and bootstrap by session mode"
```

**Resume note:** After a context reset, re-read `extensions/pi-superpowers.ts`, confirm `resources_discover` and `before_agent_start` now branch on `currentMode`, then continue from the first unchecked item.

### Step 3: Add `/super` and `/normal` commands with reload-safe mode switching

**Files:**
- Modify: `extensions/pi-superpowers.ts`
- Modify: `tests/pi-superpowers/mode-state.test.mjs`
- Create: `tests/pi-superpowers/README.md`

**Why this step matters:** Skill gating is only usable if users can switch modes intentionally and safely. This step defines the public command UX and the reload-safe handoff for `/super <task>`.

**Before editing, re-read:**
- `extensions/pi-superpowers.ts`
- `docs/superpowers/specs/2026-04-06-pi-super-mode-skill-gating-design.md`
- `docs/extensions.md` sections for `registerCommand`, `ctx.reload()`, and `pi.sendUserMessage()` if reload semantics are unclear

- [x] **Write the failing test**

Add command-registration and command-side-effect tests.

```javascript
// append to tests/pi-superpowers/mode-state.test.mjs
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

  assert.equal(pi.entries.at(-1).customType, 'superpowers-mode');
  assert.equal(pi.entries.at(-1).data.mode, 'super');
  assert.equal(ctx.reloaded, true);
});
```

- [x] **Run test to verify it fails**

Run: `node --test tests/pi-superpowers/mode-state.test.mjs`
Expected: FAIL because the extension does not yet register `/super` or `/normal` commands.

- [x] **Write minimal implementation**

Implement command registration in `extensions/pi-superpowers.ts`.

Behavior requirements:
- `/super`
  - parse inline args via `parseSuperCommandArgs(args)`
  - `pi.appendEntry('superpowers-mode', { mode: 'super', changedAt: Date.now() })`
  - set `currentMode = 'super'` immediately for local consistency
  - `await ctx.reload(); return;` when no prompt was provided
  - if a prompt was provided, queue it in a reload-safe way so the task runs only after the reloaded runtime is active
- `/normal`
  - append a mode entry for `normal`
  - set `currentMode = 'normal'`
  - `await ctx.reload(); return;`

Use a persisted handoff entry for reload-safe `/super <task>` forwarding instead of relying on post-reload in-memory state. One workable pattern is:
- append `customType: 'superpowers-pending-prompt'` with `{ text, createdAt }`
- on `session_start`, if mode is `super` and a pending prompt exists that has not yet been consumed, call `pi.sendUserMessage(text)` and append a consumed marker or clear it via another custom entry

```javascript
const PENDING_PROMPT_ENTRY_TYPE = 'superpowers-pending-prompt';
const PENDING_PROMPT_CONSUMED_ENTRY_TYPE = 'superpowers-pending-prompt-consumed';

function getLatestPendingPrompt(branch) {
  let pending = null;
  let consumedAt = -1;

  for (const entry of branch) {
    if (entry.type !== 'custom') continue;
    if (entry.customType === PENDING_PROMPT_ENTRY_TYPE) pending = entry.data;
    if (entry.customType === PENDING_PROMPT_CONSUMED_ENTRY_TYPE) consumedAt = entry.data?.createdAt ?? consumedAt;
  }

  if (!pending) return null;
  return pending.createdAt === consumedAt ? null : pending;
}

pi.on('session_start', async (_event, ctx) => {
  currentMode = getLatestModeFromBranch(ctx.sessionManager.getBranch());
  applyModeIndicator(ctx, currentMode);

  const pendingPrompt = getLatestPendingPrompt(ctx.sessionManager.getBranch());
  if (currentMode === SUPER_MODE && pendingPrompt) {
    pi.appendEntry(PENDING_PROMPT_CONSUMED_ENTRY_TYPE, { createdAt: pendingPrompt.createdAt });
    pi.sendUserMessage(pendingPrompt.text);
  }
});
```

Write `tests/pi-superpowers/README.md` as an explicit manual verification checklist for:
- fresh session skill list in normal mode
- `/super` causing skills to appear after reload
- `/super fix this bug` forwarding the task once
- `/normal` removing skills after reload
- `/new` resetting mode to normal

- [x] **Run test to verify it passes**

Run: `node --test tests/pi-superpowers/mode-state.test.mjs tests/pi-superpowers/bootstrap.test.mjs`
Expected: PASS

- [x] **Run broader verification for this step**

Run: `node --test tests/pi-superpowers/*.test.mjs`
Expected: PASS

- [x] **Commit checkpoint**

```bash
git add extensions/pi-superpowers.ts tests/pi-superpowers/mode-state.test.mjs tests/pi-superpowers/bootstrap.test.mjs tests/pi-superpowers/README.md
git commit -m "feat(pi): add super mode commands"
```

**Resume note:** After a context reset, re-read the command handlers and the pending-prompt helper logic, then confirm the test file covers command registration and pending-prompt consumption before continuing.

### Step 4: Update Pi documentation to match the new mode model

**Files:**
- Modify: `docs/README.pi.md`
- Test: `docs/README.pi.md`

**Why this step matters:** The install and usage docs currently describe always-on skill loading and automatic bootstrap behavior, which will be false after the refactor.

**Before editing, re-read:**
- `docs/README.pi.md`
- `docs/superpowers/specs/2026-04-06-pi-super-mode-skill-gating-design.md`
- `extensions/pi-superpowers.ts`

- [x] **Write the failing test**

```bash
rg -n "first prompt of each session|installed as normal Pi skills|Use superpowers brainstorming|/skill:brainstorming" docs/README.pi.md
```

Expected: matches old always-on wording that must be removed or rewritten.

- [x] **Run test to verify it fails**

Run: `rg -n "first prompt of each session|installed as normal Pi skills|Use superpowers brainstorming|/skill:brainstorming" docs/README.pi.md`
Expected: matches are present, proving the doc still describes the old behavior.

- [x] **Write minimal implementation**

Rewrite `docs/README.pi.md` so it explains:
- normal mode is the default
- `/super` enables Superpowers mode for the current session
- `/normal` disables it
- skills are intentionally unavailable in normal mode
- `/reload` preserves the active mode, but new sessions start normal
- example usage uses `/super ...` rather than plain always-on behavior

Use content like:

```markdown
## How It Works

The Pi package provides a mode-gated Superpowers experience:

1. **Normal mode** — default for new sessions. No Superpowers bootstrap is injected and Superpowers skills are not exposed.
2. **Super mode** — enabled with `/super`. The extension exposes the repository `skills/` directory, injects the `using-superpowers` bootstrap instructions, and shows `SUPER ON`.

## Usage

Enable Superpowers for the current session:

```text
/super
```

Enable Superpowers and immediately give Pi a task:

```text
/super debug this failing test
```

Return to normal mode:

```text
/normal
```
```

- [x] **Run test to verify it passes**

Run: `rg -n "Normal mode|Super mode|/super|/normal|SUPER ON" docs/README.pi.md`
Expected: matches for the new mode-gated behavior.

- [x] **Run broader verification for this step**

Run: `git diff -- docs/README.pi.md`
Expected: only Pi usage and behavior docs changed; no unrelated edits.

- [x] **Commit checkpoint**

```bash
git add docs/README.pi.md
git commit -m "docs(pi): document super mode workflow"
```

**Resume note:** After a context reset, re-read the current README and confirm it no longer promises always-on bootstrap behavior before continuing.

### Step 5: Final verification across tests, docs, and manual checklist

**Files:**
- Modify if needed: `extensions/pi-superpowers.ts`
- Modify if needed: `tests/pi-superpowers/*.mjs`
- Modify if needed: `tests/pi-superpowers/README.md`
- Modify if needed: `docs/README.pi.md`

**Why this step matters:** The feature only succeeds if unit-tested helper logic, documented behavior, and Pi runtime manual verification all agree.

**Before editing, re-read:**
- `docs/superpowers/specs/2026-04-06-pi-super-mode-skill-gating-design.md`
- `docs/plans/2026-04-06-pi-super-mode-skill-gating.md`
- `tests/pi-superpowers/README.md`

- [ ] **Write the failing test**

Use the manual checklist as the failure detector: execute it against the current runtime before any final cleanup and note any mismatches.

```markdown
1. Start a fresh Pi session in this repo.
2. Confirm Superpowers skills are absent in normal mode.
3. Run `/super` and confirm `SUPER ON` appears and skills are available.
4. Run `/normal` and confirm the indicator clears and skills disappear.
5. Run `/super debug this failing test` and confirm the task is forwarded once after reload.
6. Run `/reload` and confirm the active mode persists.
7. Run `/new` and confirm the new session starts in normal mode.
```

- [ ] **Run test to verify it fails**

Run: follow `tests/pi-superpowers/README.md`
Expected: any discrepancy found here must be treated as a failing verification and fixed before completion.

- [ ] **Write minimal implementation**

Fix only the specific mismatch uncovered by the manual run. Keep changes narrow and update tests/docs if the failure revealed a missing assertion or unclear operator guidance.

- [ ] **Run test to verify it passes**

Run: `node --test tests/pi-superpowers/*.test.mjs`
Expected: PASS

- [ ] **Run broader verification for this step**

Run all of the following:

```bash
node --test tests/pi-superpowers/*.test.mjs
rg -n "Normal mode|Super mode|/super|/normal|SUPER ON" docs/README.pi.md
git diff --stat
```

Expected:
- unit tests pass
- README contains the new mode model
- diff is limited to the planned extension/tests/docs files

- [ ] **Commit checkpoint**

```bash
git add extensions/pi-superpowers.ts tests/pi-superpowers docs/README.pi.md
git commit -m "feat(pi): add explicit super mode"
```

**Resume note:** After a context reset, start with the manual checklist result, verify whether any runtime-only issue is still open, then continue from the first unchecked item.

## Self-review

- **Spec coverage:**
  - normal mode has no skills or bootstrap → Steps 2, 3, 4, 5
  - `/super` enables persistent session mode → Steps 2 and 3
  - `/normal` disables it → Step 3
  - `SUPER ON` indicator → Steps 2 and 3
  - `/reload`/resume preservation → Steps 2, 3, and 5
  - docs updated → Step 4
- **Placeholder scan:** No `TODO`, `TBD`, or “implement later” placeholders remain in the execution steps.
- **Type consistency:** Mode names and custom entry types are defined once in Step 1 and reused consistently in later steps.
- **Resume safety:** Every step includes exact files to re-read, exact verification commands, and a checkpoint commit.

## Execution handoff

Plan complete and saved to `docs/plans/2026-04-06-pi-super-mode-skill-gating.md`. Next step is iterative execution using `superpowers:executing-plans`.

**Execution model:**
- Work step-by-step through the plan
- Stop at meaningful checkpoints
- If context gets crowded or the session ends, resume from the first unchecked step
- Before resuming, re-read the plan and only the files listed for the current step

- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
**Ready to continue?**
