import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Optical Waveguide Modes',
  description: 'Slab waveguide mode analysis: V-number, NA, and effective index.'
};

export default function Page() {
  return <PageClient />;
}
