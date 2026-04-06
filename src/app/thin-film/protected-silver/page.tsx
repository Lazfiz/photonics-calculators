import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Protected Silver Mirror',
  description: 'Protected silver coating — high reflectance UV-Vis-IR with dielectric overcoat and adhesion layer.'
};

export default function Page() {
  return <PageClient />;
}
