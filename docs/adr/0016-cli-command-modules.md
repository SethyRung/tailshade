# ADR-0016: CLI command modules and router split

Status: Accepted.

One module per command under `src/commands/`, usage texts centralized in `src/consts/help.ts`, an if-cascade router in `src/cli.ts`, and shared value-flag parsing in `src/parse.ts`. Each command module builds its own usage errors against its own help text. A command registry — one record deriving dispatch, root usage, and help routing — was considered and declined: the if-cascade is the shape the dotfiles repo proved at six commands, and a registry can be layered on later without moving command modules. Tests stay on the single `main()` seam, split per command.

Value flags share one strict rule: a missing or flag-shaped value is a usage error for every flag, including `--format`.