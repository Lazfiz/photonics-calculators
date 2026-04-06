import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Infrared Materials',
  description: 'Ge, Si, ZnSe, chalcogenides — refractive index and properties for IR optics',
};

export default function Page() {
  return <PageClient />;
}
