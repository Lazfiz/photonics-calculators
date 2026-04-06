import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Photoresponse Non-Uniformity',
  description: 'PRNU measures the spatial variation in pixel sensitivity across the sensor array. PRNU = PRNU% mean signal.'
};

export default function Page() {
  return <PageClient />;
}
