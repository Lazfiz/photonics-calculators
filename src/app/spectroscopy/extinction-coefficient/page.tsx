import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Extinction Coefficient',
  description: 'Calculate molar and specific extinction coefficients from absorbance measurements. Beer-Lambert law: = A / (cl).',
};

export default function Page() {
  return <PageClient />;
}
