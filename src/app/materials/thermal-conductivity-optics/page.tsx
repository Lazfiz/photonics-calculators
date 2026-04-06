import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Thermal Conductivity for Optics',
  description: 'Heat transport in optical substrates',
};

export default function Page() {
  return <PageClient />;
}
