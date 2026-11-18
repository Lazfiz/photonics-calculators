/**
 * Fill-factor bounds of the plenoptic-camera page and API schema (fill = f_µ/(N_w·p_µ), the micro-image diameter over the
 * lenslet pitch). Kept apart from `light-field.ts`, which other pages import. Model tier: textbook.
 */

/** Upper bound: above this fill the micro-images overlap by more than 2 % of the pitch and neighbouring views mix. */
export const MICRO_IMAGE_OVERLAP_FILL = 1.02;
/** Lower bound: below this fill the micro-images leave gaps of more than 2 % of the pitch and sensor pixels go unused. */
export const MICRO_IMAGE_GAP_FILL = 0.98;
