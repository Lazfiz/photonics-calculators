import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Sum Frequency Generation (SFG)',
  description: 'Upconversion via χ⁽²⁾: 1 + 2 3 with phase matching.'
};

export default function Page() {
  return <PageClient />;
}
