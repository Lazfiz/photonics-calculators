import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Medical Laser Safety Calculator',
  description: 'Analyze irradiance, fluence, thermal relaxation, and OD for medical/surgical laser systems.'
};

export default function Page() {
  return <PageClient />;
}
