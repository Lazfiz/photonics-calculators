import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Mueller Polarimetry',
  description: 'Build optical systems using Mueller matrices and analyze polarization transformations.'
};

export default function Page() {
  return <PageClient />;
}
