import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Bundle Design',
  description: 'Calculate bundle geometry, fill factor, étendue, and coupling efficiency for fiber optic bundles.'
};

export default function Page() {
  return <PageClient />;
}
