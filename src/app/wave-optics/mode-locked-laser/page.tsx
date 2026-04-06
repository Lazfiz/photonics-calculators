import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Mode-Locked Laser',
  description: 'Ultrashort pulse generation through passive or active mode-locking.'
};

export default function Page() {
  return <PageClient />;
}
