import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Infrared Hazard Calculator',
  description: 'Assess corneal and retinal IR hazard for 780 nm – 106 µm lasers. Covers IR-A, IR-B, and IR-C regions.'
};

export default function Page() {
  return <PageClient />;
}
