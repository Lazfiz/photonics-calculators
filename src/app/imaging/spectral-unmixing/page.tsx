import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Spectral Unmixing',
  description: 'Decompose mixed spectral signals into constituent endmember abundances using linear unmixing methods.'
};

export default function Page() {
  return <PageClient />;
}
