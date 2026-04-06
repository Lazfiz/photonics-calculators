import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Brewster Angle & Total Internal Reflection',
  description: 'Interactive Brewster-angle and critical-angle explorer with common material presets.'
};

export default function Page() {
  return <PageClient />;
}
