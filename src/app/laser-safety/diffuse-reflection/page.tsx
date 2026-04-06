import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Diffuse Reflection Hazard',
  description: 'Evaluate hazard from Lambertian (diffuse) reflections off matte surfaces. Uses extended-source MPE.'
};

export default function Page() {
  return <PageClient />;
}
