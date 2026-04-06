import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Characterization',
  description: 'Comprehensive fiber parameter calculation: V-number, MFD, effective area, nonlinear coefficient, dispersion, and confinement.'
};

export default function Page() {
  return <PageClient />;
}
