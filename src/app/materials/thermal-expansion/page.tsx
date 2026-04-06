import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Thermal Expansion',
  description: 'L = T L — dimensional change from temperature',
};

export default function Page() {
  return <PageClient />;
}
