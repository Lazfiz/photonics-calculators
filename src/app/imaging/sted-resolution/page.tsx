import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'STED Super-Resolution Calculator',
  description: 'Calculate STED (Stimulated Emission Depletion) microscopy resolution based on saturation intensity and depletion parameters.'
};

export default function Page() {
  return <PageClient />;
}
