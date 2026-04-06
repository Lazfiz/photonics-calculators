import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'UV Optical Materials',
  description: 'Deep UV to near-UV materials comparison. Sellmeier: n² = 1 + Σ Bi²/(² - Ci)',
};

export default function Page() {
  return <PageClient />;
}
