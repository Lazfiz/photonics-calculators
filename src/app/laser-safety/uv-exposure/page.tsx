import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/uv-exposure' },
    title: 'UV Exposure Limits',
  description: 'Interactive UV Exposure Limits calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
