---
name: handover
description: End-of-session routine - tick the ROADMAP box in one line, refresh the status table, rewrite docs/HANDOVER.md (≤80 lines), update the active-handover memory, then suggest /clear. Use when a phase or stage is finished.
---
# Handover

Goal: the next session starts from small files. `docs/ROADMAP.md` holds open work only, and
`docs/archive/roadmap-history.md` is frozen history. Never paste a session log into either of them.

1. **`docs/ROADMAP.md`:**
   - Tick the finished box and shrink it to one line: session, branch and headline numbers (the PR doesn't exist yet;
     `gh pr list --state all -L 1` gives the last number, the next one is +1). Move it to "Done".
   - Add each newly found open issue under its category in "Open findings", with its evidence in one line.
   - Refresh the status table from `npx tsx scripts/tier-status.ts`.
2. **`docs/HANDOVER.md`:** rewrite it in ≤ 80 lines, with these parts:
   - `# Handover — <date> (session N → N+1)`.
   - **Start here:** 2–3 lines on what is done, its branch and PR, and the next stage.
   - **State:** new modules, shared components and counts.
   - **Next actions:** numbered. Include the `post-merge-check` arguments (page=default value) for `/ship`.
   - **Non-obvious facts:** keep the ones still true and add this session's. Drop anything a skill, script or `CLAUDE.md`
     already covers.
3. **Memory `active-handover.md`:** update its description and the "next" line. Add no session log; git and the PRs
   hold the history.
4. **Commit** the docs (`docs: … handover`) on the feature branch, before `/ship`, so they merge in the same PR. Never
   open a separate docs PR: each merge to `main` costs a Vercel production build (Hobby plan build limits).
5. **Tell the user** this is a good point for `/clear`.
