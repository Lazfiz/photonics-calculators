import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Dichroic Polarizer',
  description: 'Model absorption-based dichroic polarizers using complex refractive indices. One polarization state is strongly absorbed while the other transmits.'
};

export default function Page() {
  return <PageClient />;
}
