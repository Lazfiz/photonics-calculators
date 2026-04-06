import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Acousto-Optic Materials',
  description: 'Acousto-optic figure of merit, Bragg angle, and deflection calculations',
};

export default function Page() {
  return <PageClient />;
}
