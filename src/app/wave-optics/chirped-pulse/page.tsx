import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Chirped Pulse Amplification (CPA)',
  description: 'Stretch, amplify, compress — bypassing damage thresholds.'
};

export default function Page() {
  return <PageClient />;
}
