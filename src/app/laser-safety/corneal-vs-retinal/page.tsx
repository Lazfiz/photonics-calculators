import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Corneal vs Retinal Limits',
  description: 'Compares corneal MPE with equivalent retinal irradiance, showing the eye\',s focusing gain and which limit governs.'
};

export default function Page() {
  return <PageClient />;
}
