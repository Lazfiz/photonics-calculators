import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Two-Layer AR Coating',
  description: 'Design a two-layer anti-reflection coating. Optimal condition: n = nnsub.'
};

export default function Page() {
  return <PageClient />;
}
