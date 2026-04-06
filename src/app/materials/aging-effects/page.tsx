import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Aging of Optical Materials',
  description: 'Long-term degradation: transmission loss, solarization, compaction, stress relaxation',
};

export default function Page() {
  return <PageClient />;
}
