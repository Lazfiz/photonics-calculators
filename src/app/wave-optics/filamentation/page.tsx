import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Filamentation Dynamics',
  description: 'Laser filamentation — balance of Kerr self-focusing, plasma defocusing, and diffraction.'
};

export default function Page() {
  return <PageClient />;
}
