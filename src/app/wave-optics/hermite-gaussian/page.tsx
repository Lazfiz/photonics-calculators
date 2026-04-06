import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Hermite-Gaussian Modes (TEMmn)',
  description: 'Rectangular higher-order Gaussian beam modes.'
};

export default function Page() {
  return <PageClient />;
}
