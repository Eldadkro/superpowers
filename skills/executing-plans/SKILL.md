---
name: executing-plans
description: Use when you have a written implementation plan and need to execute it iteratively, resume after context resets, and continue from the first incomplete meaningful step
---

# Executing Plans

## Overview

Load plan, review critically, execute it step-by-step, and resume cleanly from the first incomplete meaningful step whenever context resets.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. Identify the first incomplete top-level step
4. Read the files listed for that step and any narrowly relevant supporting files
5. If concerns: Raise them with your human partner before starting
6. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Iteratively

For each top-level step:
1. Mark as in_progress
2. Follow the checklist items exactly
3. Run verifications as specified
4. Mark the checklist items complete in the plan
5. Stop at the checkpoint for that step

### Step 3: Complete Development

After all top-level steps complete and are verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## Resuming After Context Reset

When context is crowded, the session ends, or you intentionally pause:

1. Stop at the current step boundary, not mid-edit if avoidable
2. Ensure the plan reflects which checklist items and top-level steps are complete
3. On resume, re-read the full plan header and the current top-level step
4. Re-read only the files listed for that step plus any directly relevant neighbors
5. Check git status and the latest checkpoint commit to confirm actual state
6. Continue from the first unchecked checklist item in the first incomplete top-level step

Do not rely on memory. Reconstruct state from the plan, the files, and git.

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Execute one meaningful top-level step at a time
- Re-read plan and relevant files on resume instead of relying on memory
- Keep the plan state accurate so the next session can restart safely
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
