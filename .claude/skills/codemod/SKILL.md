---
name: codemod
description: Safe procedure for any edit touching more than 10 files - AST codemod with ts-morph, dry run, sample diff review, tsc gate. Use for bulk refactors, migrations, renames, and repairs across many pages. Never use regex/sed/Python rewrites for this.
---
# Codemod (bulk edit >10 files)

Why: regex/Python bulk rewrites corrupted the JSON-LD in 427 pages (`6929ab07`) and broke the build
(2026-04-19..21). AST edits can't produce unparseable code.

1. **Scope:** list the target files with `git ls-files '<glob>'` and count them. Pick 2–3 tricky
   examples (odd formatting, already-corrupted files) to design against.
2. **Script:** `scripts/codemods/<yyyy-mm-dd>-<name>.ts`, run with `npx tsx`. Use `ts-morph`
   (`npm i -D ts-morph` on first use). Requirements:
   - Find nodes structurally (e.g. a `CallExpression` named `generateCalculatorJsonLd`), not by text.
   - Be idempotent: running it twice changes nothing.
   - Skip and **report** anything that doesn't match the expected shape. Don't guess.
   - Support `--dry-run` (default) and `--write`. The dry run prints `changed / skipped / unchanged` counts
     and the skipped file list.
3. **Dry run:** check that the counts match expectations, and explain any skipped files.
4. **Sample review:** run `--write` on 5 files (include the tricky ones), `git diff` them, and read every
   hunk. Fix the script and `git checkout` those files if anything is off.
5. **Apply:** `--write` on all files. Then `git diff --stat | tail -3`. The file count must equal the
   "changed" count.
6. **Gate:** full `tsc` (background, about 4 min), then `npm test`, then `npm run build` before pushing. On a
   red gate, `git checkout -- .` and fix the script rather than patching output by hand.
7. **Commit:** the codemod script and its output go in one commit, `refactor(scope): <what> (codemod)`, with
   the counts in the body. Keep the script in the repo for reference.
