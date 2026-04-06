import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Maximum Permissible Exposure (MPE)',
  description: 'Bounded CW point-source MPE pre-check for 400–1050 nm and 1 ms to 310^4 s using explicitly implemented ANSI-style table slices.'
};

export default function Page() {
  return <PageClient />;
}
