import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/dof",
    title: 'Depth of Field',
  description: 'Microscope depth of field including diffraction and detector contributions.'
};

export default function Page() {
  return <PageClient />;
}
