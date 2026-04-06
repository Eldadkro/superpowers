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

That's it. Pi will load:
- the Superpowers skills from this repository's `skills/` directory
- the Pi bootstrap extension from `extensions/pi-superpowers.ts`

## How It Works

The Pi package provides two things:

1. **Skills** - Superpowers skills are installed as normal Pi skills.
2. **Bootstrap extension** - On the first prompt of each session, the extension injects the `using-superpowers` instructions so Pi starts with the same skill-discipline behavior expected on other harnesses.

## Tool Mapping

When Superpowers skills mention tools from other harnesses, use the Pi equivalent:

- `Skill` tool → Pi skill loading / `/skill:name`
- `Read`, `Write`, `Edit`, `Bash` → Pi's native tools
- `TodoWrite` → Track progress in the plan file or a `TODO.md` file
- `Task` with subagents → No built-in equivalent in Pi; execute sequentially unless you installed a Pi extension/package that adds subagents

## Usage

Ask Pi to do normal work such as:
- "Help me plan this feature"
- "Debug this failing test"
- "Use superpowers brainstorming"

If you want to force-load a specific skill manually, use:

```text
/skill:brainstorming
```

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

### Skills not showing up

1. Run `pi list` and confirm the package is installed
2. Run `/reload`
3. Start a new Pi session

### Bootstrap behavior not appearing

1. Make sure the package installed successfully: `pi list`
2. Start a fresh session after install
3. Check that Pi supports extensions in your installed version

## Getting Help

- Report issues: https://github.com/Eldadkro/superpowers/issues
- Main documentation: https://github.com/Eldadkro/superpowers
- Pi docs: https://pi.dev
