import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Enhanced Aluminum Mirror',
  description: 'Aluminum mirror with dielectric overcoat to boost reflectance in the visible.'
};

export default function Page() {
  return <PageClient />;
}
