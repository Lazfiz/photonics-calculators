import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Wedge Thin Film',
  description: 'Wedged thin films have a linearly varying thickness across the surface, creating spatially',
};

export default function Page() {
  return <PageClient />;
}
