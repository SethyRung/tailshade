# tailwind_tools

One-shot CLI: one CSS base color in, a Tailwind 50–950 palette out. Package `@sethyrung/tailwind_tools`, binary `tailwind_tools`. No server and no UI (`jsx` in `tsconfig.json` is unused scaffold).

## How it runs

- Repo commands use Bun (`bun install`, `bun test`, `bun run <script>`). Engines: Bun >= 1.4, Node >= 18.
- `bin/cli.js` is the published bin. On Bun it imports `index.ts`, so source stays live (`bun link` included). On Node it imports `dist/cli.js`.
- `dist/cli.js` exists only after `bun run build` (`--target=node --packages=external`). `prepack` runs that build. `dist/` is generated and gitignored.
- `package.json` `files` includes `bin`, `dist`, `src`, `index.ts`, and `tsconfig.json` so a published Bun install can import the TypeScript entry. Keep those.
- `index.ts` must keep its top-level run: call `main`, print `output`, set `process.exitCode`. The bin works by importing that file.

## Code

- `main(argv)` in `src/cli.ts` is pure: argv in, `{ output, exitCode }` out, no I/O. That function is the only test seam.
- Generation is `src/core.ts` (culori, internal OKLCH). `src/targets.ts` holds fixed v4-derived lightness and chroma constants, not flags.
- Import with the `@/*` alias (`@/core`), no `.ts` suffix. `verbatimModuleSyntax` is on: type-only names use `import type` or inline `type`.
- `bun run typecheck` is the repo's TypeScript 7 (`peerDependencies`). Do not add a TypeScript 5 dependency.

## Tests

Call `main` from `@/cli` and assert on the returned string and exit code. Recover numbers by parsing that text. Suite is `test/cli.test.ts`. Do not spawn the binary or unit-test `src/` helpers.

```bash
bun test
bun test -t "substring"
```

## Invariants

- The base color is verbatim at `--step` (default 500). The chroma taper is scaled relative to that anchor.
- Default stdout is pipe-clean. ANSI is added only when `--preview` is passed.
- Emitted notation is `--format` (`oklch` default, or `hex` / `rgb` / `hsl`) for both the `@theme` block and `--v3`. `--json` and `--ts` stay rejected. The palette stays OKLCH internally.
- The name is the nearest CSS color, kebab-cased. Collisions with Tailwind builtins stay as detected; `--name` is the only override. Hue is constant across steps.

## Docs that lag the code

`docs/adr`, `docs/specs`, and the `bun.lock` workspace name still say `tailshade`. Some ADRs still describe `--json` / `--ts` or a private unpublished CLI. Package, binary, and help text are `tailwind_tools`. When an ADR or spec disagrees with `src/`, `test/`, or `README.md`, follow the code.

Use glossary words from `CONTEXT.md` when naming domain concepts in code, docs, tests, or help text.

Read the matching file in `docs/adr` before changing generation, output format, naming, or flags.

`.scratch/` is gitignored. Issue and spec layout is in `docs/agents/issue-tracker.md`.

## Agent skills

### Issue tracker

Issues and specs live as markdown files in `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
