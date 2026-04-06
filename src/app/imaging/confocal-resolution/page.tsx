import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Confocal Resolution Calculator',
  description: 'Compare lateral and axial resolution between widefield and confocal microscopy with adjustable pinhole size.'
};

export default function Page() {
  return <PageClient />;
}
