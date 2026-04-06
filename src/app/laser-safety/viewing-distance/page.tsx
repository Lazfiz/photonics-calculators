import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Safe Viewing Distance (CW point-source pre-check)',
  description: 'Bounded CW point-source direct-beam viewing-distance pre-check using the same assumptions as the MPE and NOHD pages.'
};

export default function Page() {
  return <PageClient />;
}
