import CalculatorShell from "@/components/calculator-shell";
import { calculatorMetadata } from "@/registry/metadata";
import PageClient from "./page-client";

const href = "/wave-optics/optical-parametric-amplifier";

export const metadata = calculatorMetadata(href);

export default function Page() {
  return (
    <CalculatorShell href={href} maxWidthClassName="max-w-6xl">
      <PageClient />
    </CalculatorShell>
  );
}
