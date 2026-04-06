import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'TIRF Penetration Depth Calculator',
  description: 'Evanescent field penetration depth for Total Internal Reflection Fluorescence microscopy.'
};

export default function Page() {
  return <PageClient />;
}
