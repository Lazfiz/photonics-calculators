import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: 'FTIR Resolution Calculator',
  description: 'FTIR spectral resolution from maximum OPD, apodization, and scan parameters.',
};

export default function Page() {
  return <PageClient />;
}
