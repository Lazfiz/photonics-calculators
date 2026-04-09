import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/polarization/birefringence-imaging",
    title: 'Birefringence Imaging',
  description: 'Simulate quantitative birefringence imaging with polarizer/analyzer rotation and compensators. Visualize stress-induced birefringence patterns.'
};

export default function Page() {
  return <PageClient />;
}
