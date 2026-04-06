import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Photoelastic Constants',
  description: 'Stress-induced birefringence: n = C , where C is the stress-optic coefficient',
};

export default function Page() {
  return <PageClient />;
}
