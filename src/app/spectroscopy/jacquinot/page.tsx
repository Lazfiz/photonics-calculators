import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Jacquinot Advantage',
  description: 'FTIR throughput advantage over dispersive instruments. G = 2/(̃2L) where L = max OPD.',
};

export default function Page() {
  return <PageClient />;
}
