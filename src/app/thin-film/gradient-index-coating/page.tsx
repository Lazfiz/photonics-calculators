import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Gradient Index Coating',
  description: 'Gradient-index (GRIN) antireflection coatings use a continuously varying refractive index to suppress Fresnel reflections over a broad bandwidth.'
};

export default function Page() {
  return <PageClient />;
}
