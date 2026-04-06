import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Waveplate Thickness Calculator',
  description: 'Calculate required crystal thickness for waveplates of any retardance order.'
};

export default function Page() {
  return <PageClient />;
}
