import { ImageResponse } from "next/og";

import { calculators, categories, findCalculator, getCategory } from "../../../registry";
import { tierInfo } from "../../../registry/tiers";

// The social-preview image of every calculator (/og/<category>/<slug>) and category index (/og/<category>).
// generateStaticParams makes each a build-time PNG, so no request runs the renderer.
// calculatorMetadata and categoryMetadata (src/registry/metadata.ts) point openGraph.images and twitter.images here.

const SITE_NAME = "Photonics Calculators";
const SIZE = { width: 1200, height: 630 };

export function generateStaticParams() {
  return [
    ...categories.map((category) => ({ path: [category.id] })),
    ...calculators.map((calculator) => ({ path: [calculator.category, calculator.slug] })),
  ];
}

/** Shrinks the title's font as it gets longer so three lines always fit. */
function titleSize(title: string): number {
  if (title.length <= 28) return 84;
  if (title.length <= 48) return 68;
  return 54;
}

export async function GET(_request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  let kicker: string;
  let title: string;
  let badge: string | null = null;
  if (path.length === 1) {
    const category = categories.find((c) => c.id === path[0]);
    if (!category) return new Response("Not found", { status: 404 });
    kicker = "Calculators";
    title = category.title;
  } else if (path.length === 2) {
    const calculator = findCalculator(`/${path[0]}/${path[1]}`);
    if (!calculator) return new Response("Not found", { status: 404 });
    kicker = getCategory(calculator.category).label;
    title = calculator.title;
    if (calculator.tier) badge = `${tierInfo(calculator.tier).label} model`;
  } else {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#030712",
          color: "#f3f4f6",
          padding: "64px 72px",
          borderLeft: "16px solid #3b82f6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 36, color: "#93c5fd" }}>{kicker}</div>
        <div style={{ display: "flex", fontSize: titleSize(title), fontWeight: 700, lineHeight: 1.1, color: "#ffffff" }}>
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 32 }}>
          <div style={{ display: "flex", color: "#d1d5db" }}>{SITE_NAME}</div>
          {badge ? (
            <div
              style={{
                display: "flex",
                padding: "8px 24px",
                border: "2px solid #4b5563",
                borderRadius: 999,
                fontSize: 28,
                color: "#d1d5db",
              }}
            >
              {badge}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...SIZE, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
