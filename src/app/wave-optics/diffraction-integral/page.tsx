import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Diffraction Integral Calculator',
  description: 'Fresnel/Kirchhoff diffraction patterns.'
};

export default function Page() {
  return <PageClient />;
}
