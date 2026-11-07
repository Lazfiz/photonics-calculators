#!/usr/bin/env node
// PreToolUse(Bash) hook: block an unbounded polling loop (`until/while … do … sleep … done`). Agents wrote
// `until grep -q "<marker>" <log>; do sleep 5; done` in the background; when the command they waited on failed, or
// devctl never started it (exit 75), the marker never came and the loop ran on after the agent had finished
// (sessions 221 and 222). A loop under `timeout <seconds>` is allowed. Exit 2 + stderr = block.

let input = "";
for await (const chunk of process.stdin) input += chunk;

let command = "";
try {
  command = JSON.parse(input)?.tool_input?.command ?? "";
} catch {
  process.exit(0);
}

// Heredoc bodies and `-m "…"` messages are text (commit messages, PR bodies), not shell code.
const code = command
  .replace(/<<-?\s*['"]?(\w+)['"]?[^\n]*\n[\s\S]*?\n\s*\1\s*(?=\n|$)/g, "")
  .replace(/\s-m\s+("(?:[^"\\]|\\.)*"|'[^']*')/g, "");
const pollingLoop = /\b(?:until|while)\b[\s\S]*?\bdo\b[\s\S]*?\bsleep\b[\s\S]*?\bdone\b/.test(code);
const bounded = /\btimeout\s+\d+[smh]?\s/.test(command);

if (pollingLoop && !bounded) {
  process.stderr.write(
    "BLOCKED: unbounded polling loop (until/while … sleep). It never ends if the awaited output never appears.\n" +
      "Run the long command itself with run_in_background and wait for its completion notification instead.\n" +
      "If you really must poll, bound it: timeout 900 bash -c 'until …; do sleep 10; done'.\n",
  );
  process.exit(2);
}
