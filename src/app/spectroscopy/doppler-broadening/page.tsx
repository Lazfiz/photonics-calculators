import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Doppler Broadening Calculator',
  description: 'Calculate Doppler (thermal) line broadening FWHM from gas temperature and atomic/molecular mass.'
};

export default function Page() {
  return <PageClient />;
}
