import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: '3D Reconstruction Methods',
  description: 'Compare 3D reconstruction approaches: resolution, sampling, voxel budgets, and method tradeoffs.'
};

export default function Page() {
  return <PageClient />;
}
