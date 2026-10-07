---
name: physics-audit
description: Audit one or more calculators (by slug) for physics correctness - formulas, units, constants, domain guards, model tier, references, tests. Output ≤30 lines per calculator. Use when reviewing calculator physics or when asked to check a calculator.
---
# Physics audit: `$ARGUMENTS` (one or more `<category>/<slug>`)

For each slug:
1. Read `src/app/<category>/<slug>/page-client.tsx` (and any `src/physics/**` / `src/lib/**` module it
   imports). Skim the JSX and focus on the computation and the input defaults/limits.
2. Write every formula in math notation and identify the model: standard textbook result, approximation,
   or ad-hoc. Name the reference you'd check it against (book + eq., or paper).
3. Check:
   - **Units:** trace each input from UI unit to SI and back. Look for factor-of-10³/10⁶/10⁹ slips, dB
     (10 vs 20·log10), and angle units.
   - **Constants:** inline `3e8`, `1.6e-19` etc. (flag them), and wrong values.
   - **Math:** sign errors, `-(x)**2`, `erf` vs `erfc` vs `Q`, `log` vs `log10`, missing `2π`, and
     complex conjugates.
   - **Domain:** ÷0, sqrt/log of negatives, `asin` out of range, NaN/Infinity reaching results or charts, and
     loops without caps.
   - **Defaults:** run the default inputs through the formula by hand (or with `node -e`). Is the result
     physically plausible? Compare with a known published example where one exists.
   - **Duplicates:** `git ls-files src/app | grep -i <keyword>` to find sibling calculators that
     disagree.
4. Classify: **Exact / Textbook approximation / Illustrative / Wrong**.

## Output (≤30 lines per slug, no preamble)
```
<category>/<slug>: <tier>, verdict OK | BUG | QUESTIONABLE
Formulas: <one line each>
Findings: [severity] file:line, issue, why, and the fix in one line
Numeric check: inputs → expected (source) vs got
Test to add: <golden value + reference>
```
Don't edit files. This skill is read-only and reports only.
