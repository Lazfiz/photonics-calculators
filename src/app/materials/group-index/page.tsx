import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Group Index (ng)',
  description: 'ng = n − dn/d — the effective index seen by optical pulses',
};

export default function Page() {
  return <PageClient />;
}
