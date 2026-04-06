import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Apodization Comparison',
  description: 'Compare 9 window functions and their instrument line shapes (ILS). Select windows to overlay.'
};

export default function Page() {
  return <PageClient />;
}
