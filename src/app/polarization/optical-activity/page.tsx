import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Optical Activity',
  description: 'Calculate optical rotation from specific rotation, concentration, and path length with wavelength/temperature corrections.'
};

export default function Page() {
  return <PageClient />;
}
