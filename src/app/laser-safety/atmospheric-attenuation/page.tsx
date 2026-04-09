import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/atmospheric-attenuation",
    title: 'Atmospheric Attenuation',
  description: 'Calculates atmospheric beam attenuation using Beer-Lambert law with water vapor absorption, CO absorption, Rayleigh and Mie scattering. Useful for outdoor laser safety NOHD calculations.'
};

export default function Page() {
  return <PageClient />;
}
