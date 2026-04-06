import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Dispersion Compensation',
  description: 'GVD and TOD compensation analysis for fiber optic links.'
};

export default function Page() {
  return <PageClient />;
}
