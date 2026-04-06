import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Coefficient of Thermal Expansion',
  description: 'Thermal expansion of optical materials',
};

export default function Page() {
  return <PageClient />;
}
