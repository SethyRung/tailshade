/** Value of the token after a value flag: undefined when missing or flag-shaped. */
export function takeValue(args: readonly string[], index: number): string | undefined {
  const value = args[index + 1];
  if (value === undefined || value.startsWith("--")) return undefined;
  return value;
}
