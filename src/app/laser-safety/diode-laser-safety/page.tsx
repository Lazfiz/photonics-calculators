import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Diode Laser Safety Calculator',
  description: 'Calculate MPE, NOHD, and OD requirements for diode laser bars/stacks with asymmetric divergence.'
};

export default function Page() {
  return <PageClient />;
}
