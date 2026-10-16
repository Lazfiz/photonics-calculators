---
name: ship
description: Push the current branch, open the PR, watch CI and ask the user to merge. Release only on an explicit user request. Use when a phase or stage is finished and its gates are green.
---
# Ship `$ARGUMENTS` (optional: the PR title)

Before this: `/handover` is committed on this branch (no separate docs PR), `npm run check` and `npm run build`
are green on the final tree (`/verify`), and the tree is clean.

A commit, push, completed task or merged PR does not authorise a production release. Releases happen only when the user asks, by pushing `main` to `release`.

1. **Push** (never force-push; never put a token in a remote):
   `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`
2. **PR:**
   - Write the body to a scratchpad file. It holds the session's detail: physics with golden values, pages, sources and
     gates. It ends with the attribution lines. ROADMAP gets only one line.
   - `gh pr create --base main --title "<conventional title>" --body-file <file>`
3. **CI:** run `gh pr checks <n> --watch` in the background and read only its last lines.
   - The gate is `check-and-build`. Vercel builds only `release`, so a PR has no Vercel check and no preview. To check a
     branch, use a local `npm run build` and `npx next start -p 3100`.
4. **Merge:** ask the user. Only on a yes, run:
   - `gh pr merge <n> --merge`
   - `git checkout main`
   - `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' pull --ff-only`
5. **Release (only when the user asks):** never do this step without an explicit user request.
   - `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin main:release`
   - `node scripts/post-merge-check.mjs <release sha> <category>/<slug>=<default value> … [<category>/<slug>]`
   - Use the SHA of the commit pushed to `release` as `<release sha>`.
   - Give pages with no leading slash, so Git Bash leaves them alone.
   - The script waits for the Vercel status and checks each value in the prerendered HTML. It then loads every page
     in headless Chrome and prints a few lines.
   - Report that summary. On a miss, inspect the page with `curl -s <url> | sed 's/<[^>]*>/ /g' | grep -o "<text>"`.
