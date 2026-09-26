#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bunEntry = join(here, "../index.ts");
const nodeEntry = join(here, "../dist/cli.js");

if (typeof globalThis.Bun !== "undefined") {
  await import(pathToFileURL(bunEntry).href);
} else if (existsSync(nodeEntry)) {
  await import(pathToFileURL(nodeEntry).href);
} else {
  process.stderr.write("tailwind_tools: Node needs a built CLI. Run `bun run build`.\n");
  process.exit(1);
}
