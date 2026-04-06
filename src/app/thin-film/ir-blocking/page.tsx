import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'IR Blocking Filter',
  description: 'Long-pass quarter-wave stack reflecting near-IR while transmitting visible light.'
};

export default function Page() {
  return <PageClient />;
}
