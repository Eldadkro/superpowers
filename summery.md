# Superpowers Summary

## What This Project Is

Superpowers is a workflow layer for coding agents. It is not one monolithic tool or framework. It is a set of skills that tell an agent how to work: when to slow down, when to plan, when to test first, when to debug systematically, when to review, and when to verify before claiming success.

The core idea is that agents should not jump straight into coding. Instead, they should follow a disciplined workflow that reduces guessing, sloppy implementation, and false completion claims.

## How It Works

The project is built around automatic skill usage. The `using-superpowers` skill is the entry-point behavior: if a skill might apply, the agent is expected to invoke it before acting.

The main development flow described across the README and skills is:

1. `brainstorming`
   Turn a rough idea into a reviewed design/spec before any implementation work starts.

2. `using-git-worktrees`
   Create an isolated worktree on a separate branch so work does not happen directly on the main workspace.

3. `writing-plans`
   Convert the approved spec into a highly detailed implementation plan with exact files, code snippets, tests, commands, and verification steps.

4. `subagent-driven-development` or `executing-plans`
   Carry out the plan either with fresh subagents per task and staged review, or inline in a separate session with checkpoints.

5. `test-driven-development`
   Enforce red-green-refactor during implementation: test first, prove it fails, write minimal code, prove it passes.

6. `requesting-code-review` and `receiving-code-review`
   Review work continuously and handle review feedback with technical rigor instead of performative agreement.

7. `verification-before-completion`
   Require fresh evidence before saying anything is fixed, passing, or complete.

8. `finishing-a-development-branch`
   Wrap up by verifying tests, then choosing a structured end state: merge, PR, keep branch, or discard.

## Main Philosophy

Across the skills, the project repeats a few core rules:

- Process beats improvisation.
- Root cause beats symptom-fixing.
- Test-first beats code-first.
- Verification beats confidence.
- Isolation beats ad-hoc edits on the main branch.
- Explicit review beats unchecked progress.

The repo treats skills as behavior-shaping code, not just prose documentation. Many of the skills are intentionally strict and include anti-rationalization language to stop the agent from skipping discipline when under time pressure.

## Main Skills

### Entry and Coordination

#### `using-superpowers`

This is the meta-skill that governs the whole system. It says the agent must check for relevant skills before responding or acting. It also defines priority: user instructions override skills, and skills override default model behavior.

#### `dispatching-parallel-agents`

Used when multiple independent problems can be investigated or fixed in parallel. It emphasizes one focused agent per problem domain, self-contained prompts, and careful integration afterward.

### Design and Planning

#### `brainstorming`

This skill is mandatory before creative implementation work. It forces the agent to explore project context, ask clarifying questions one at a time, compare approaches, present a design in reviewable sections, write a spec, self-review it, and only then transition to planning.

It explicitly hard-gates implementation work until a design is presented and approved.

#### `writing-plans`

This skill turns an approved spec into a detailed implementation plan. It assumes the implementer has little context and therefore requires exact file paths, code blocks, commands, expected outputs, and test steps.

Its plans are intentionally granular: each step should be a small action, usually 2-5 minutes. It bans placeholders like "TODO", "add validation", or "write tests" without concrete content.

#### `executing-plans`

This skill executes an already-written plan in a separate session. It starts by reviewing the plan critically, stops if the plan is unclear or blocked, then follows each task exactly and hands off to branch-finishing at the end.

It is the simpler alternative to subagent orchestration.

#### `subagent-driven-development`

This is the more advanced implementation workflow. It executes a plan by dispatching a fresh implementer subagent per task, then reviewing each task in two stages:

- spec compliance review
- code quality review

It is built for fast iteration with isolated task context and structured review between tasks.

### Implementation Discipline

#### `test-driven-development`

This is one of the strictest skills in the repo. It enforces:

- no production code before a failing test
- verify the test fails for the right reason
- write the minimum code to pass
- refactor only after green

It explicitly says that if code was written before the test, it should be deleted and rewritten from tests.

#### `verification-before-completion`

This skill prevents the agent from claiming success without fresh evidence. It requires identifying the proving command, running it fully, reading the output, and only then making claims like "tests pass" or "bug fixed".

It treats unverified completion claims as dishonesty rather than harmless optimism.

### Debugging and Quality Control

#### `systematic-debugging`

This skill requires root-cause investigation before any fix attempt. Its four-phase model is:

1. root cause investigation
2. pattern analysis
3. hypothesis and testing
4. implementation

It is explicitly anti-thrashing: no random fixes, no patch stacking, no "quick fix now, investigate later".

#### `requesting-code-review`

This skill says review should happen early and often. It instructs the agent to dispatch a code-reviewer with focused context, compare a change against its requirements, and fix critical or important issues before continuing.

#### `receiving-code-review`

This skill governs how review feedback should be handled. Its main point is that code review is technical evaluation, not emotional performance. The agent should understand feedback, verify it against the codebase, push back when needed, and avoid fake agreement.

### Workspace and Delivery

#### `using-git-worktrees`

This skill sets up isolated development workspaces using git worktrees. It chooses a worktree location systematically, verifies ignored directories when needed, creates the worktree on a new branch, runs project setup, and verifies a clean baseline before implementation starts.

#### `finishing-a-development-branch`

This skill formalizes the end of the workflow. First, tests must pass. Then the agent presents exactly four choices:

1. merge locally
2. push and create a PR
3. keep the branch as-is
4. discard the work

It also handles cleanup and requires explicit confirmation before destructive discard operations.

### Skill Authoring

#### `writing-skills`

This is the repo's guide for creating or editing skills. It frames skill-writing as TDD for process documentation: establish baseline failure, write the skill, test that behavior improves, then close loopholes.

It also defines how skills should be structured, named, scoped, and pressure-tested.

## Skill Groups At a Glance

### Collaboration and Workflow

- `using-superpowers`
- `brainstorming`
- `writing-plans`
- `executing-plans`
- `subagent-driven-development`
- `dispatching-parallel-agents`
- `using-git-worktrees`
- `finishing-a-development-branch`

### Testing and Verification

- `test-driven-development`
- `verification-before-completion`

### Debugging and Review

- `systematic-debugging`
- `requesting-code-review`
- `receiving-code-review`

### Meta / Maintenance

- `writing-skills`

## Overall Assessment

Superpowers is a disciplined operating system for agentic software development. Its main contribution is not a single feature, but a full workflow that pushes the agent toward:

- design before code
- isolated workspaces
- detailed plans
- test-first implementation
- systematic debugging
- repeated review
- evidence-based completion

The repo's main skills are therefore the workflow backbone:

- `brainstorming`
- `using-git-worktrees`
- `writing-plans`
- `subagent-driven-development`
- `executing-plans`
- `test-driven-development`
- `systematic-debugging`
- `verification-before-completion`
- `finishing-a-development-branch`

The remaining skills support or enforce that backbone.
