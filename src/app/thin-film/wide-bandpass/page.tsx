import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Wide Bandpass Filter',
  description: 'Cascaded short-pass + long-pass quarter-wave stacks for broad transmission bands.'
};

export default function Page() {
  return <PageClient />;
}
