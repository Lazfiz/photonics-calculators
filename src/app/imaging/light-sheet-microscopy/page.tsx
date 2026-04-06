import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Light Sheet Microscopy Design Calculator',
  description: 'Full light sheet microscope design parameters: sheet geometry, tilt geometry, and volume imaging.'
};

export default function Page() {
  return <PageClient />;
}
