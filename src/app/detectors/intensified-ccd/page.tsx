import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Intensified CCD (ICCD)',
  description: 'Photocathode MCP phosphor CCD gain chain with gating and noise analysis.'
};

export default function Page() {
  return <PageClient />;
}
