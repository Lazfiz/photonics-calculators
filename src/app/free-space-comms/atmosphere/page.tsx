import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Atmospheric Transmission',
  description: 'Molecular and aerosol extinction for free-space optical links.'
};

export default function Page() {
  return <PageClient />;
}
