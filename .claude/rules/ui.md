---
paths:
  - "src/components/**"
  - "src/hooks/**"
---
# UI components

- **Number inputs:** let the user type freely; clamp and validate on blur/commit, never on every keystroke
  (with min=10, typing "50" must not become 10). Never pass an out-of-range or non-finite value to
  `onChange` / the physics.
- **SSR/hydration:** no `window`, `document`, `localStorage`, `Date.now()` or `Math.random()` during render.
  Read them in `useEffect` or in event handlers. Server and first client render must be identical.
- **Charts:** filter out `NaN` **and** `±Infinity` before plotting. Log axes must handle values down to
  1e-18 and skip non-positive values. Don't silently clamp to an arbitrary floor.
- **Legibility:** rendered text is ≥11 px at phone width. Don't rely on a fixed `viewBox` that scales labels
  down to 4–5 px. Size to the real container width.
- **A11y:** every input has a `<label>` (or `aria-label`). Results are text, not color alone. Keep visible
  focus styles, keep contrast at WCAG AA on the dark theme, and give charts a text alternative.
- Shared components are used by ~500 pages. A behavior change here is a site-wide change, so test it on
  2–3 representative calculators (`/verify`).
