import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Plasma Deposition',
  description: 'Model plasma-enhanced deposition parameters: electron temperature, ion density, sheath voltage, and deposition rate.'
};

export default function Page() {
  return <PageClient />;
}
