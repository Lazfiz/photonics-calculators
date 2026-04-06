import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Infrared Optical Materials',
  description: 'Compare IR transmitting materials. n(T) = n₅ + (dn/dT)(T - 25°C)',
};

export default function Page() {
  return <PageClient />;
}
