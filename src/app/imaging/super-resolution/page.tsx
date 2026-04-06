import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Super-Resolution Calculator',
  description: 'STED and PALM/STORM resolution limits beyond the diffraction barrier.'
};

export default function Page() {
  return <PageClient />;
}
