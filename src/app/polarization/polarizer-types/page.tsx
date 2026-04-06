import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Polarizer Types Comparison',
  description: 'Compare extinction ratio, transmission, damage threshold, and other specs across common polarizer types.'
};

export default function Page() {
  return <PageClient />;
}
