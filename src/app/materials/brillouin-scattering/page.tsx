import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Brillouin Scattering',
  description: 'Stimulated Brillouin scattering (SBS): frequency shift, gain coefficient, and power threshold in optical fibers and bulk materials.'
};

export default function Page() {
  return <PageClient />;
}
