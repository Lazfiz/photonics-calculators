import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Depth of Field',
  description: 'Microscope depth of field including diffraction and detector contributions.'
};

export default function Page() {
  return <PageClient />;
}
