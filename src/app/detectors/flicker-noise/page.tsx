import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: '1/f Flicker Noise',
  description: 'Flicker noise: S_v(f) = K_f I^ / f. Noise spectral density falls as 1/f.',
};

export default function Page() {
  return <PageClient />;
}
