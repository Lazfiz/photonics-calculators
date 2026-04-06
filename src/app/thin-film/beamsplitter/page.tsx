import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Beamsplitter Design',
  description: 'Dielectric beamsplitters split light into reflected and transmitted beams. A single quarter-wave',
};

export default function Page() {
  return <PageClient />;
}
