import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fiber Bragg Grating Sensor',
  description: 'Calculate FBG wavelength shift for strain and temperature sensing applications.'
};

export default function Page() {
  return <PageClient />;
}
