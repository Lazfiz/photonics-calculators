import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Coating Stress & Curvature',
  description: 'Stoney',
};

export default function Page() {
  return <PageClient />;
}
