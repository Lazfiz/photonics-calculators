import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Light Field Microscopy',
  description: 'Angular resolution, spatial-angular tradeoff, and synthetic aperture parameters.'
};

export default function Page() {
  return <PageClient />;
}
