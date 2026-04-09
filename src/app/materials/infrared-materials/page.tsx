import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/infrared-materials' },
    title: 'Infrared Materials',
  description: 'Ge, Si, ZnSe, chalcogenides — refractive index and properties for IR optics',
};

export default function Page() {
  return <PageClient />;
}
