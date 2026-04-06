import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Optical Sectioning Calculator',
  description: 'Optical section thickness for confocal and widefield microscopy.'
};

export default function Page() {
  return <PageClient />;
}
