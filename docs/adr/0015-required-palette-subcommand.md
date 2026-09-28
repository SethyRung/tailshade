# ADR-0015: Required palette subcommand

Status: Accepted. Supersedes ADR-0010.

tailwind_tools is a multi-command CLI with one command today. The command word is lowercase `palette` and must be the first token. A bare positional color is rejected. There is no compatibility alias.

The Base color is passed one of two ways, never both:

- `tailwind_tools palette <color> [flags]` — the positional sits in the slot immediately after `palette`.
- `tailwind_tools palette [flags] --color <color>` — used when that slot is empty. The value is the next argv.

If both are present, or `--color` is repeated, exit 1. No silent winner, even when the values match. If neither is present, exit 1.

Waiting for a second command, and keeping the old form as an alias, were both rejected. 0.1.0 was published the same day with no sign of external callers, and two grammars cost more than the break. A positional that may sit anywhere among flags was rejected for the same reason: one slot, or the flag, not a third form.
