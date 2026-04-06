import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Poincaré Sphere',
  description: 'Interactive visualization of polarization states on the Poincaré sphere.'
};

export default function Page() {
  return <PageClient />;
}
