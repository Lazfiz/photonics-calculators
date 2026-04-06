import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'CCD/CCM Sensor Design',
  description: 'CCD sensor parameters, cooling requirements, dark current, and dynamic range analysis.'
};

export default function Page() {
  return <PageClient />;
}
