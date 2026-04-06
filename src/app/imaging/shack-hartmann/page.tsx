import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Shack-Hartmann Sensor',
  description: 'SHWFS design: spot size, centroid precision, sensitivity, dynamic range, and sub-aperture layout.'
};

export default function Page() {
  return <PageClient />;
}
