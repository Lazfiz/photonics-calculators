import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Nominal Ocular Hazard Distance (NOHD)',
  description: 'Bounded CW point-source NOHD pre-check derived from the same direct-beam ocular MPE branch as the MPE page.'
};

export default function Page() {
  return <PageClient />;
}
