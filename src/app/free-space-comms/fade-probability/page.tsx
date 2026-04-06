import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fade Probability',
  description: 'Interactive Fade Probability calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
