import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Field of View Calculator',
  description: 'Calculate sample FOV from sensor dimensions and system magnification.'
};

export default function Page() {
  return <PageClient />;
}
