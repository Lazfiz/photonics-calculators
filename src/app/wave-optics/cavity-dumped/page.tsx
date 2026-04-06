import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Cavity-Dumped Laser',
  description: 'Energy extraction from a laser cavity using fast Q-switching or intracavity modulation.'
};

export default function Page() {
  return <PageClient />;
}
