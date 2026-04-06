import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Hybrid Detector Design',
  description: 'Photodiode + TIA hybrid — noise analysis, NEP, and gain optimization.'
};

export default function Page() {
  return <PageClient />;
}
