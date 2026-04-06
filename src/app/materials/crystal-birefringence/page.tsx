import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Crystal Birefringence Data',
  description: 'n = |nₒ − nₑ| for uniaxial and birefringent crystals at selected wavelength',
};

export default function Page() {
  return <PageClient />;
}
