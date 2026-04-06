import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Dark Current vs Temperature',
  description: 'Silicon detector dark current — exponential doubling model. I_dark(T) = I₀ 2^((T−T₀)/T_d).',
};

export default function Page() {
  return <PageClient />;
}
