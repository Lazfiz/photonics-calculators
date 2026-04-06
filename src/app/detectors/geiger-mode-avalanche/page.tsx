import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Geiger-Mode APD',
  description: 'SPAD: breakdown voltage, overbias, temperature effects, PDE, and dark count rate.'
};

export default function Page() {
  return <PageClient />;
}
