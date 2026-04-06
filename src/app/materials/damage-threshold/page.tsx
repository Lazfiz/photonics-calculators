import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Laser Damage Threshold',
  description: 'LIDT for pulsed and CW laser optics',
};

export default function Page() {
  return <PageClient />;
}
