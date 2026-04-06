import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Ellipsometry',
  description: 'Calculate Ψ, from Fresnel equations; model thin film interference in ellipsometry.'
};

export default function Page() {
  return <PageClient />;
}
