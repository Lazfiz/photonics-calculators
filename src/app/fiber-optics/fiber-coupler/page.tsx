import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Coupler',
  description: 'Interactive Fiber Coupler calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
