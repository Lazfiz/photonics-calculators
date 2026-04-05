import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: 'Pointing Loss',
  description: 'Interactive free-space optical pointing-loss calculator with jitter, misalignment, and aperture coupling.',
};

export default function Page() {
  return <PageClient />;
}
