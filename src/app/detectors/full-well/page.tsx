import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Full Well Capacity vs SNR',
  description: 'Analyze how full well capacity affects signal-to-noise ratio and dynamic range.'
};

export default function Page() {
  return <PageClient />;
}
