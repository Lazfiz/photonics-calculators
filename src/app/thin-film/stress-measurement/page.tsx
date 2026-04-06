import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Thin Film Stress Measurement',
  description: 'Calculate film stress from substrate curvature using the Stoney equation. Includes thermal stress decomposition and stored elastic energy.'
};

export default function Page() {
  return <PageClient />;
}
