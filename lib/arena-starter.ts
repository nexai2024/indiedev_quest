import type { ArenaChallenge } from "@/lib/content/arena-challenges";

export function toStarterCode(challenge: ArenaChallenge): string {
  const header = `// ${challenge.title}\n// ${challenge.description}\n// Write the implementation. Leave no TODO. Export your function or class.\n\n`;
  const code = challenge.initialCode;
  const classes = [...code.matchAll(/^class\s+(\w+)/gm)].map((match) => match[1]!);
  const fns = [...code.matchAll(/^((?:async\s+)?function\s+[^{\n]+)/gm)].map((match) => match[1]!.trim());
  const parts: string[] = [
    ...classes.map((name) => `export class ${name} {\n  // TODO: implement\n}\n`),
    ...fns.map((signature) => `export ${signature} {\n  throw new Error("TODO");\n}\n`),
  ];
  if (parts.length === 0) return `${header}throw new Error("TODO");\n`;
  return header + parts.join("\n");
}

export function looksUnsolved(code: string, starter: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return true;
  if (trimmed === starter.trim()) return true;
  if (/\bTODO\b/i.test(trimmed)) return true;
  if (trimmed.length < 50) return true;
  return false;
}
