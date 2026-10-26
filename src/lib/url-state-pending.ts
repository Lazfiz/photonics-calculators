/**
 * Hides a calculator's inputs and results on a shared link until hydration has applied the URL values.
 *
 * Pages are prerendered with default inputs, and `useURLState` switches to the URL values right after
 * hydration, so a shared link would first paint the defaults and then jump. The inline script below runs
 * in the root layout before the body content is parsed: when the query holds any param other than
 * tracking ones it marks `<html>`, and `globals.css` hides `[data-url-state-target]` (the shell's wrapper
 * around the client component) with `visibility`, which keeps the layout. `UrlStateReveal` clears the mark
 * on the first frame after hydration. If the JS never runs, a CSS animation shows the content after
 * `URL_STATE_REVEAL_FALLBACK_MS`. Links without params (most visits) are unaffected.
 */

export const URL_STATE_ATTRIBUTE = "data-url-state";

/** Query params that never hold calculator state. */
const TRACKING_PARAM = "^(utm_|fbclid$|gclid$|msclkid$)";

/** Plain ES5 that runs before hydration; it reads only `location` and `document`. */
export const URL_STATE_PENDING_SCRIPT =
  `(function(){try{var q=location.search.slice(1).split("&");` +
  `for(var i=0;i<q.length;i++){var k=decodeURIComponent(q[i].split("=")[0]);` +
  `if(k&&!/${TRACKING_PARAM}/.test(k)){document.documentElement.setAttribute("${URL_STATE_ATTRIBUTE}","pending");return}}` +
  `}catch(e){}})()`;
