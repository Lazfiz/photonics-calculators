import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Partial Reflector Design',
  description: 'Partial reflectors (output couplers, etalon mirrors) provide controlled reflectance between',
};

export default function Page() {
  return <PageClient />;
}
