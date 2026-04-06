import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fluorescence Lifetime Calculator',
  description: 'Model single and bi-exponential fluorescence decay curves. Calculate intensity-weighted average lifetimes.'
};

export default function Page() {
  return <PageClient />;
}
