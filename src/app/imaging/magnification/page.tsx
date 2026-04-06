import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Total Magnification Calculator',
  description: 'Calculate total system magnification from objective, tube lens, and camera adapter lens.'
};

export default function Page() {
  return <PageClient />;
}
