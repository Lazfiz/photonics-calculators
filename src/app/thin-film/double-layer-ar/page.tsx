import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/double-layer-ar",
      title: 'Two-Layer AR Coating',
  description: 'Transfer-matrix method for two-layer V-coat or W-coat AR designs. Both layers at quarter-wave optical thickness.',
};

export default function Page() {
  return <PageClient />;
}
