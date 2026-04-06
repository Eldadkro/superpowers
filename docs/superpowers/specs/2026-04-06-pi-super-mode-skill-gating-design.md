# Pi Super Mode Skill Gating Design

**Date:** 2026-04-06
**Status:** Proposed

## Summary

Refactor the Pi extension so Superpowers skills are unavailable by default and only become available when the user explicitly enables a session-scoped `super` mode with `/super`. While `super` mode is active, the extension should expose the Superpowers `skills/` directory to Pi, inject the `using-superpowers` bootstrap instructions before agent execution, and display a visible `SUPER ON` indicator. The mode remains active until the user runs `/normal` or starts a new session.

## Goals

- Remove Superpowers skill overhead from normal Pi usage
- Prevent Superpowers skills from being available in normal mode at all
- Enable Superpowers on demand with `/super`
- Keep Superpowers active across follow-up prompts until `/normal` or a new session
- Preserve mode across `/reload` and session resume
- Provide a clear visible indicator while Super mode is active

## Non-Goals

- Rewriting historical session context when the mode changes
- Changing the contents of Superpowers skills themselves
- Adding per-skill selective loading inside Super mode
- Creating a separate dedicated session automatically for Super mode

## User Experience

### Normal mode

A fresh Pi session starts in `normal` mode.

In `normal` mode:
- the extension contributes no Superpowers skill paths
- the extension injects no `using-superpowers` bootstrap instructions
- Superpowers skills are not available through Pi skill discovery or `/skill:name`
- no `SUPER ON` indicator is shown

### Super mode

The user enables Super mode with `/super`.

In `super` mode:
- the extension contributes the repository `skills/` directory via Pi resource discovery
- the extension injects the `using-superpowers` bootstrap instructions before agent execution
- the extension displays a visible `SUPER ON` status indicator
- Superpowers remains active for follow-up prompts in the same session

### Commands

#### `/super`
- switches the current session into `super` mode
- reloads resources so Superpowers skills become available
- if inline text is provided, that text is sent as the next user prompt after mode activation
- if no inline text is provided, mode is enabled without sending a task prompt

Examples:
- `/super`
- `/super fix this failing test`

#### `/normal`
- switches the current session back to `normal` mode
- reloads resources so Superpowers skills disappear
- clears the `SUPER ON` indicator

### Session boundaries

- starting a new session resets to `normal`
- reloading the runtime preserves the current mode
- resuming an existing session restores the latest persisted mode for that session branch
- forking inherits the mode at the fork point unless Pi session behavior requires a different default

## Architecture

### Extension state model

The extension owns a session-scoped mode flag:
- `normal`
- `super`

Mode is persisted in session history using a custom entry, for example:

```json
{
  "customType": "superpowers-mode",
  "data": {
    "mode": "super",
    "changedAt": 1775491200000
  }
}
```

On `session_start`, the extension reconstructs the current mode by scanning the current branch for the latest `superpowers-mode` entry.

This gives:
- persistence across `/reload`
- correct restoration on resume
- mode inheritance on fork from the selected branch state
- reset to `normal` for fresh sessions that have no persisted mode entry

### Dynamic skill discovery

The extension must implement `resources_discover` and conditionally expose the Superpowers skill path.

Behavior:
- in `normal` mode: return no Superpowers `skillPaths`
- in `super` mode: return the repository `skills/` path

This is the core mechanism that removes Superpowers skills entirely from normal mode rather than merely avoiding bootstrap injection.

### Conditional bootstrap injection

The extension must inject the `using-superpowers` bootstrap content only while in `super` mode.

Behavior:
- in `normal` mode: `before_agent_start` returns nothing
- in `super` mode: `before_agent_start` injects the stripped `using-superpowers` content as a hidden custom message

The existing `superpowers-bootstrap-installed` one-time marker should be removed or replaced because it conflicts with mode switching. Bootstrap presence should be governed by current mode, not by whether the session was ever previously bootstrapped.

### Commands and mode transitions

The extension registers two commands:
- `/super`
- `/normal`

### `/super` flow
1. Persist a `superpowers-mode` entry with `mode: "super"`
2. Trigger Pi reload so resources are rediscovered
3. Reconstruct mode as `super` during reload startup
4. Contribute Superpowers skill paths via `resources_discover`
5. Re-establish UI indicator showing `SUPER ON`
6. If the command had inline text, send that text as a user prompt after mode activation

### `/normal` flow
1. Persist a `superpowers-mode` entry with `mode: "normal"`
2. Trigger Pi reload so resources are rediscovered
3. Reconstruct mode as `normal` during reload startup
4. Contribute no Superpowers skill paths
5. Clear the `SUPER ON` indicator

### UI behavior

While `super` mode is active, the extension should show a stable visible indicator such as a footer status label or widget text reading `SUPER ON`.

Indicator requirements:
- visible whenever the session is in `super` mode
- restored on reload and resume
- removed immediately after switching back to `normal`

### Implementation notes

### File scope

Initial implementation can stay in:
- `extensions/pi-superpowers.ts`
- `docs/README.pi.md`

If the file becomes unwieldy, the extension can later be split into helpers for:
- state restoration
- bootstrap loading
- command handling
- UI updates

### Reload safety

Pi’s docs note that code after `await ctx.reload()` continues in the old command call frame. The implementation must therefore avoid depending on stale in-memory state after reload.

For `/super <task>` specifically, the prompt-forwarding logic must be designed so that the task is delivered under the reloaded runtime where:
- mode has already been restored as `super`
- skill paths have been rediscovered
- bootstrap injection is active

The implementation should use a reload-safe handoff pattern rather than assuming post-reload code runs with fresh extension state.

### Error handling

- If the Superpowers `skills/` directory cannot be resolved, `/super` should fail with a clear user-visible error and leave the session in a predictable state
- If bootstrap content cannot be loaded, the extension should avoid partial activation claims and surface a clear error
- If reload fails, the extension should preserve the last persisted mode entry and report that the mode change did not complete cleanly

### Testing strategy

Verify the refactor with session-level behavior checks covering:

1. Fresh session starts in `normal` mode
   - no Superpowers skill commands are available
   - no bootstrap injection occurs

2. `/super` enables Super mode
   - Superpowers skill commands appear after reload
   - `SUPER ON` indicator is visible

3. `/super <task>` forwards the task correctly
   - the task runs after mode activation
   - bootstrap is present for that task
   - Superpowers skills are available during execution

4. Follow-up prompts stay in Super mode
   - subsequent prompts continue to receive bootstrap injection
   - skills remain available

5. `/normal` disables Super mode
   - Superpowers skill commands disappear after reload
   - bootstrap is no longer injected
   - `SUPER ON` indicator is cleared

6. `/reload` preserves current mode
   - if in Super mode before reload, Super mode remains active after reload
   - if in normal mode before reload, Super mode remains off after reload

7. New session resets to normal
   - no inherited Super mode unless resuming or forking an existing branch that already has it

### Open questions

1. What is the most reliable reload-safe mechanism for forwarding `/super <task>` into the newly reloaded runtime?
2. Does Pi update the interactive command list immediately after reload in all environments where this package is used?
3. Does fork behavior need an explicit override, or is inheriting branch-local mode state sufficient and intuitive?

## Recommendation

Implement dynamic skill exposure and conditional bootstrap injection together as one coherent refactor. The key product behavior is strict separation:
- no Superpowers skills in normal mode
- full Superpowers availability only in explicit Super mode

That separation is more important than minimizing extension complexity, because it directly addresses the context and workflow interference problem this refactor is meant to solve.
