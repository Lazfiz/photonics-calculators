import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Retinal Hazard Calculator',
  description: 'Estimate retinal irradiance and image size from corneal laser parameters. Simplified model assuming emmetropic eye.'
};

export default function Page() {
  return <PageClient />;
}
