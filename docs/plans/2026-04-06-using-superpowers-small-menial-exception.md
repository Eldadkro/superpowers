# Using Superpowers Small-Menial-Work Exception Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan iteratively. Steps use checkbox (`- [ ]`) syntax for tracking so work can resume cleanly after context resets.

**Goal:** Add a narrow exception to `skills/using-superpowers/SKILL.md` so tiny menial tasks can skip brainstorming, writing-plans, and worktree setup while still requiring all other relevant skills.

**Architecture:** Update the skill text in one place to define the exception, its limits, and its non-goals. Verify by checking that the new language is present, narrowly scoped, and explicitly preserves other applicable skills.

**Tech Stack:** Markdown skill docs, ripgrep, git

---

### Step 1: Add the narrow exception to the skill

**Files:**
- Modify: `skills/using-superpowers/SKILL.md`
- Test: `skills/using-superpowers/SKILL.md`

**Why this step matters:** This is the behavior change itself and should remain narrow enough to avoid creating a loophole that bypasses the broader skill system.

**Before editing, re-read:**
- `skills/using-superpowers/SKILL.md`
- `skills/brainstorming/SKILL.md`
- `skills/using-git-worktrees/SKILL.md`
- `skills/writing-plans/SKILL.md`

- [x] **Write the failing test**

```bash
rg -n "small menial work|current worktree|skip brainstorming|skip writing-plans|skip using-git-worktrees" skills/using-superpowers/SKILL.md
```

Expected: no matches for the new exception language before editing.

- [x] **Run test to verify it fails**

Run: `rg -n "small menial work|current worktree|skip brainstorming|skip writing-plans|skip using-git-worktrees" skills/using-superpowers/SKILL.md`
Expected: exit status 1 / no matches because the exception does not exist yet.

- [x] **Write minimal implementation**

Add a short section to `skills/using-superpowers/SKILL.md` that:
- defines a `small menial work` exception for roughly 1-2 minor file edits
- allows skipping `brainstorming`, `writing-plans`, and `using-git-worktrees`
- says to do the work in the current worktree
- explicitly preserves all other applicable skills
- includes red flags so agents do not stretch this into feature work or behavior design

- [x] **Run test to verify it passes**

Run: `rg -n "small menial work|current worktree|skip brainstorming|skip writing-plans|skip using-git-worktrees" skills/using-superpowers/SKILL.md`
Expected: matches showing the new exception language.

- [x] **Run broader verification for this step**

Run: `git diff -- skills/using-superpowers/SKILL.md`
Expected: diff only shows the narrow exception and supporting guardrails.

- [x] **Commit checkpoint**

```bash
git add skills/using-superpowers/SKILL.md docs/plans/2026-04-06-using-superpowers-small-menial-exception.md
git commit -m "docs: allow tiny skill edits in current worktree"
```

**Resume note:** After a context reset, find the first unchecked item above, re-read the files under "Before editing, re-read", confirm whether the exception text already exists in `skills/using-superpowers/SKILL.md`, then continue from the first incomplete checkbox.
