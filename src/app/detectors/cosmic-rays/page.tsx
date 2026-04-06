import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Cosmic Ray Detection',
  description: 'Cosmic ray flux and impact on imaging sensors — estimate hit rates and affected pixels.'
};

export default function Page() {
  return <PageClient />;
}
