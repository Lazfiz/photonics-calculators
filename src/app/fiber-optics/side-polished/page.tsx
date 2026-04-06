import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Side-Polished Fiber',
  description: 'Evanescent field interaction, phase matching, and spectral response of side-polished fiber devices.'
};

export default function Page() {
  return <PageClient />;
}
