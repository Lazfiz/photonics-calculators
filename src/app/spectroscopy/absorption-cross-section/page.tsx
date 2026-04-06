import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Absorption Cross-Section Calculator',
  description: '= 1000 / (N_A ln 10) — convert molar extinction coefficient to molecular cross-section.',
};

export default function Page() {
  return <PageClient />;
}
