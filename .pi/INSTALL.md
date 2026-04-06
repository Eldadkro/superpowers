# Installing Superpowers for Pi

Install Superpowers as a Pi package so Pi loads both the skills and the bootstrap extension.

## Prerequisites

- Pi installed
- Git available on your system

## Installation

1. Install the package:
   ```bash
   pi install https://github.com/Eldadkro/superpowers
   ```

2. Restart Pi, or run:
   ```text
   /reload
   ```

## Verify

Start a new Pi session and ask for something that should trigger a workflow skill, for example:

```text
Help me plan a feature.
```

Pi should follow the Superpowers workflow and invoke relevant skills.

## Updating

```bash
pi update https://github.com/Eldadkro/superpowers
```

## Uninstalling

```bash
pi remove https://github.com/Eldadkro/superpowers
```

## Notes

- Pi has native file and shell tools, so Superpowers skills map naturally to those.
- Pi does not include built-in subagents or TodoWrite. Skills that assume those features fall back to sequential execution and file-based progress tracking.

## More Details

See [docs/README.pi.md](../docs/README.pi.md).
