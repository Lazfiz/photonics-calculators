import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'OTDR Analysis',
  description: 'Simulate OTDR traces, calculate spatial resolution, dynamic range, dead zones, and event analysis for fiber characterization.'
};

export default function Page() {
  return <PageClient />;
}
