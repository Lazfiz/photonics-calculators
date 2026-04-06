import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Absorption Coefficient',
  description: 'Wavelength-dependent absorption coefficient () and transmission through material thickness.',
};

export default function Page() {
  return <PageClient />;
}
