import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: 'OD Requirements (manual validated-limit mode)',
  description: 'Manual validated-limit optical-density math for laser safety workflows when the irradiance limit has already been obtained externally.',
};

export default function Page() {
  return <PageClient />;
}
