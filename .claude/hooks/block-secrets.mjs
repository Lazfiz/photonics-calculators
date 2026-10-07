#!/usr/bin/env node
// PreToolUse(Bash) hook: block `git commit` when the staged diff (or the command itself)
// contains a real-looking credential. Exit 2 + stderr = block. Never echoes the secret.
import { execFileSync } from "node:child_process";

const TOKEN_PATTERNS = [
  /\b(?:github_pat|gh[pousr])_[A-Za-z0-9_]{30,}/, // GitHub PATs / OAuth / app tokens
  /\bsk-[A-Za-z0-9-]{30,}/, // OpenAI / Anthropic / z.ai-style API keys
];

let input = "";
for await (const chunk of process.stdin) input += chunk;

let command = "";
try {
  command = JSON.parse(input)?.tool_input?.command ?? "";
} catch {
  process.exit(0);
}
if (!/\bgit\b[^;&|\n]*\bcommit\b/.test(command)) process.exit(0);

const git = (...args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  } catch {
    return "";
  }
};

// `git commit -a` / `-am` / `--all` also commits unstaged tracked changes.
const commitsAll = /\bcommit\b[^;&|\n]*\s(?:-[a-zA-Z]*a[a-zA-Z]*|--all)\b/.test(command);
const diffs = [git("diff", "--cached", "--unified=0", "--no-color")];
if (commitsAll) diffs.push(git("diff", "--unified=0", "--no-color"));

const hits = new Set();
let file = "?";
for (const diff of diffs) {
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) file = line.replace(/^\+\+\+ (b\/)?/, "");
    else if (line.startsWith("+") && TOKEN_PATTERNS.some((re) => re.test(line))) hits.add(file);
  }
}
if (TOKEN_PATTERNS.some((re) => re.test(command))) hits.add("(the git commit command line)");

if (hits.size > 0) {
  process.stderr.write(
    `BLOCKED: credential-like token found in: ${[...hits].join(", ")}.\n` +
      "Remove it from the staged changes (and rotate it if it was real). Do not bypass this hook.\n",
  );
  process.exit(2);
}
process.exit(0);
