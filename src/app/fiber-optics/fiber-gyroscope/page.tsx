import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Optic Gyroscope (FOG)',
  description: 'Sagnac effect, scale factor, angle random walk, and bias stability for fiber optic gyroscopes.'
};

export default function Page() {
  return <PageClient />;
}
