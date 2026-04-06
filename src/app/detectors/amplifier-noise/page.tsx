import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Amplifier Noise',
  description: 'Input-referred noise sets the detection floor. _amp = e_n.'
};

export default function Page() {
  return <PageClient />;
}
