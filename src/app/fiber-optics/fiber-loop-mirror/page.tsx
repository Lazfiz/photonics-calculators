import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Loop Mirror (Sagnac)',
  description: 'Sagnac fiber loop mirror reflectance, spectral response, and birefringent filter design.'
};

export default function Page() {
  return <PageClient />;
}
