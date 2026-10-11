---
name: ship
description: Push the current branch, open the PR, watch CI, ask the user to merge, then check production with one script. Use when a phase or stage is finished and its gates are green.
---
# Ship `$ARGUMENTS` (optional: the PR title)

Before this: `npm run check` and `npm run build` are green on the final tree (`/verify`), and the tree is clean.

1. **Push** (never force-push; never put a token in a remote):
   `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`
2. **PR:**
   - Write the body to a scratchpad file. It holds the session's detail: physics with golden values, pages, sources and
     gates. It ends with the attribution lines. ROADMAP gets only one line.
   - `gh pr create --base main --title "<conventional title>" --body-file <file>`
3. **CI:** run `gh pr checks <n> --watch` in the background and read only its last lines.
   - Preview deployments are behind Vercel SSO. To check a branch, use a local `npm run build` and
     `npx next start -p 3100`.
4. **Merge:** ask the user. Only on a yes, run:
   - `gh pr merge <n> --merge`
   - `git checkout main`
   - `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' pull --ff-only`
5. **Production:** `node scripts/post-merge-check.mjs <merge sha> <category>/<slug>=<default value> … [<category>/<slug>]`
   - Give pages with no leading slash, so Git Bash leaves them alone.
   - The script waits for the Vercel status and checks each value in the prerendered HTML. It then loads every page
     in headless Chrome and prints a few lines.
   - Report that summary. On a miss, inspect the page with `curl -s <url> | sed 's/<[^>]*>/ /g' | grep -o "<text>"`.
