import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Peak Power Calculator',
  description: 'Convert average power to peak power for pulsed lasers. Essential for assessing single-pulse hazards.'
};

export default function Page() {
  return <PageClient />;
}
