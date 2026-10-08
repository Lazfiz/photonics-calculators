import CalculatorShell from "@/components/calculator-shell";
import { calculatorMetadata } from "@/registry/metadata";
import PageClient from "./page-client";

const href = "/thin-film/double-layer-ar";

export const metadata = calculatorMetadata(href);

export default function Page() {
  return (
    <CalculatorShell href={href}>
      <PageClient />
    </CalculatorShell>
  );
}
