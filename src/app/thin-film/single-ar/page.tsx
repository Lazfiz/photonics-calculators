import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: 'Single Layer AR Coating',
  description: "Quarter-wave antireflection coating design with Snell's law and explicit s/p polarization handling at oblique incidence.",
};

export default function Page() {
  return <PageClient />;
}
