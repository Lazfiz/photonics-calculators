import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Rain Attenuation',
  description: 'Interactive Rain Attenuation calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
