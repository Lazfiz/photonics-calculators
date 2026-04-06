import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Rare Earth Absorption Spectra',
  description: 'Absorption cross-sections for common rare-earth dopants in silica: Er³⁺, Nd³⁺, Yb³⁺, Tm³⁺, Ho³⁺.',
};

export default function Page() {
  return <PageClient />;
}
