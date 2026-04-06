import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Spatial Filter Pinhole Sizing',
  description: 'Calculate optimal pinhole diameter for spatial filtering.'
};

export default function Page() {
  return <PageClient />;
}
