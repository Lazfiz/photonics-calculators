// What each model tier means: the label and definition every calculator page shows in its "Model and
// references" section, and the list on the about page.
import type { ModelTier } from "./types";

export interface TierInfo {
  label: string;
  definition: string;
}

export const TIERS: Record<ModelTier, TierInfo> = {
  exact: {
    label: "Exact",
    definition:
      "The equations are exact within the stated assumptions, or are a standard's tabulated values. The results are as good as the inputs.",
  },
  textbook: {
    label: "Textbook approximation",
    definition:
      "A standard approximation from the literature (for example paraxial, plane-wave or Gaussian-beam), valid within the range the page states.",
  },
  illustrative: {
    label: "Illustrative",
    definition: "A simplified model that shows trends and orders of magnitude. Don't use its numbers for design.",
  },
};

export const UNREVIEWED: TierInfo = {
  label: "Not yet reviewed",
  definition:
    "This page's model hasn't been checked against published references yet. Cross-check its results before relying on them.",
};

export function tierInfo(tier: ModelTier | undefined): TierInfo {
  return tier ? TIERS[tier] : UNREVIEWED;
}
