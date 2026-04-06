import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'UV / Blue Light Hazard',
  description: 'Calculates weighted hazard using the blue light B() and UV S() action spectra per IEC 62471 / ICNIRP guidelines.',
};

export default function Page() {
  return <PageClient />;
}
