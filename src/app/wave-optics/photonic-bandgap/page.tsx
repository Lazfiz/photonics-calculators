import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Photonic Bandgap',
  description: '1D photonic crystal band structure and reflectivity.'
};

export default function Page() {
  return <PageClient />;
}
