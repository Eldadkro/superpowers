# Superpowers for Pi

Guide for using Superpowers with [Pi](https://pi.dev) via a native Pi package + extension.

## Quick Install

Tell Pi:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/Eldadkro/superpowers/refs/heads/main/.pi/INSTALL.md
```

## Manual Installation

### Prerequisites

- Pi installed (`pi --version`)
- Git available on your system

### Steps

1. Install the package:
   ```bash
   pi install https://github.com/Eldadkro/superpowers
   ```

2. Restart Pi, or run:
   ```text
   /reload
   ```

That's it. Pi will load the mode-aware Superpowers extension from `extensions/pi-superpowers.ts`.

## How It Works

The Pi package provides a mode-gated Superpowers experience:

1. **Normal mode** — default for new sessions. No Superpowers bootstrap is injected and Superpowers skills are not exposed.
2. **Super mode** — enabled with `/super`. The extension exposes the repository `skills/` directory, injects the `using-superpowers` bootstrap instructions, and shows `SUPER ON`.

Mode behavior:
- `/super` enables Super mode for the current session
- `/normal` returns the session to normal mode
- `/reload` preserves the current mode
- `/new` starts a fresh session in normal mode

## Tool Mapping

When Superpowers skills mention tools from other harnesses, use the Pi equivalent:

- `Skill` tool → Pi skill loading / `/skill:name` when Super mode is active
- `Read`, `Write`, `Edit`, `Bash` → Pi's native tools
- `TodoWrite` → Track progress in the plan file or a `TODO.md` file
- `Task` with subagents → No built-in equivalent in Pi; execute sequentially unless you installed a Pi extension/package that adds subagents

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

In normal mode, Superpowers skills are intentionally unavailable. Enable Super mode first if you want Pi to use them.

## Updating

```bash
pi update
```

Or update just this package:

```bash
pi update https://github.com/Eldadkro/superpowers
```

## Uninstalling

```bash
pi remove https://github.com/Eldadkro/superpowers
```

## Troubleshooting

### Superpowers skills not showing up

1. Run `pi list` and confirm the package is installed
2. Make sure you are in Super mode by running `/super`
3. Run `/reload` if you just updated the package

### Super mode behavior not appearing

1. Make sure the package installed successfully: `pi list`
2. Run `/super` and confirm `SUPER ON` appears
3. Check that Pi supports extensions in your installed version

## Getting Help

- Report issues: https://github.com/Eldadkro/superpowers/issues
- Main documentation: https://github.com/Eldadkro/superpowers
- Pi docs: https://pi.dev
