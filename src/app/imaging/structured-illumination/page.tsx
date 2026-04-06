import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Structured Illumination Microscopy',
  description: 'SIM resolution enhancement and OTF expansion via patterned illumination.'
};

export default function Page() {
  return <PageClient />;
}
