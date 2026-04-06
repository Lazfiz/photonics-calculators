import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Semiconductor Bandgap',
  description: 'Bandgap energy and absorption edge vs temperature using the Varshni equation. Direct vs indirect gap materials.'
};

export default function Page() {
  return <PageClient />;
}
