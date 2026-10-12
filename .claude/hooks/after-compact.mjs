#!/usr/bin/env node
// SessionStart(compact) hook: after an auto or manual compaction, print the live state so the summary doesn't have to
// carry it. Plain stdout is added to Claude's context. Keep the output small (≈ 1k tokens).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const git = (...args) => {
  try {
    return execFileSync("git", args, { cwd: dir, encoding: "utf8", timeout: 10_000 }).trimEnd();
  } catch {
    return "(git failed)";
  }
};
const head = (text, n) => {
  const lines = text.split("\n").filter(Boolean);
  return lines.length > n ? [...lines.slice(0, n), `… ${lines.length - n} more`].join("\n") : lines.join("\n") || "(none)";
};

/** The first unchecked box under "## Next" in docs/ROADMAP.md, with its indented lines. */
function currentBox() {
  let text;
  try {
    text = readFileSync(join(dir, "docs/ROADMAP.md"), "utf8").replace(/\r\n/g, "\n");
  } catch {
    return "(docs/ROADMAP.md not found)";
  }
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith("## Next"));
  const box = lines.findIndex((l, i) => i > start && l.startsWith("- [ ]"));
  if (start < 0 || box < 0) return "(no unchecked box under ## Next)";
  const out = [lines[box]];
  for (let i = box + 1; i < lines.length && (lines[i].startsWith("  ") || lines[i] === ""); i++) out.push(lines[i]);
  return head(out.join("\n"), 20);
}

console.log(`State after compaction (.claude/hooks/after-compact.mjs):
Branch: ${git("branch", "--show-current") || "(detached)"}
Uncommitted (git status --short):
${head(git("status", "--short"), 30)}
Last commits:
${git("log", "--oneline", "-5")}
First unchecked ROADMAP box:
${currentBox()}`);
