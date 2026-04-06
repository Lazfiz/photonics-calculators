import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Delay Line',
  description: 'Interactive Fiber Delay Line calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
