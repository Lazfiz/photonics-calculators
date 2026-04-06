import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Image Stitching',
  description: 'Calculate tile grid parameters, overlap, blending profiles, and stitching accuracy for large-area microscopy.'
};

export default function Page() {
  return <PageClient />;
}
