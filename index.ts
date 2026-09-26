#!/usr/bin/env bun
import { main } from "@/cli";

const { output, exitCode } = main(process.argv.slice(2));
if (output) {
  console.log(output);
}
process.exitCode = exitCode;
