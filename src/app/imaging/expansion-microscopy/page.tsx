import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Expansion Microscopy Calculator',
  description: 'ExM effective resolution, probe size reduction, and expansion trade-offs.'
};

export default function Page() {
  return <PageClient />;
}
