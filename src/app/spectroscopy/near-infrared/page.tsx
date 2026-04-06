import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Near-Infrared (NIR) Spectroscopy',
  description: 'Overtone and combination band analysis for non-destructive composition measurement.'
};

export default function Page() {
  return <PageClient />;
}
