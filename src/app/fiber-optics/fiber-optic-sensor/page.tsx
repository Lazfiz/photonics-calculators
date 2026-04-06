import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Optic Sensors',
  description: 'Calculate sensitivity, resolution, and response for FBG, MZI, Fabry-Pérot, and evanescent fiber sensors.'
};

export default function Page() {
  return <PageClient />;
}
