import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Low Coherence Interferometry',
  description: 'Interferogram modelling, coherence gating, fringe visibility, and depth scanning parameters.'
};

export default function Page() {
  return <PageClient />;
}
