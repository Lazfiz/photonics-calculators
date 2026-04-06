import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Penetration Depth Calculator',
  description: 'Calculate optical penetration depth from complex refractive index ñ = n + ik. Includes oblique incidence via Snell\',s law.'
};

export default function Page() {
  return <PageClient />;
}
