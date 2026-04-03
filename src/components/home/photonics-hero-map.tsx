"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryDetailPanel from "./category-detail-panel";
import {
  featuredHeroCategories,
  type HomeCategory,
} from "../../lib/home-categories";

type BranchId = "spectroscopy" | "imaging" | "thin-film";

type BranchConfig = {
  id: BranchId;
  route: string;
  label: string;
  labelX: number;
  labelY: number;
  labelWidth: number;
  endpointX: number;
  endpointY: number;
  spotlight: string;
};

const branchGeometry: Record<BranchId, BranchConfig> = {
  spectroscopy: {
    id: "spectroscopy",
    route:
      "M 186 350 C 340 350, 430 348, 516 348 C 578 346, 642 316, 742 264 C 844 212, 958 172, 1128 156",
    label: "Spectroscopy",
    labelX: 944,
    labelY: 104,
    labelWidth: 156,
    endpointX: 1120,
    endpointY: 156,
    spotlight:
      "radial-gradient(circle at 84% 22%, rgba(192,132,252,0.34), transparent 0 20%), radial-gradient(circle at 88% 18%, rgba(96,165,250,0.20), transparent 0 10%)",
  },
  imaging: {
    id: "imaging",
    route:
      "M 186 350 C 350 350, 430 350, 516 350 C 636 350, 772 348, 918 346 C 1000 344, 1070 340, 1132 330",
    label: "Imaging",
    labelX: 968,
    labelY: 286,
    labelWidth: 132,
    endpointX: 1124,
    endpointY: 330,
    spotlight:
      "radial-gradient(circle at 86% 47%, rgba(96,165,250,0.30), transparent 0 20%), radial-gradient(circle at 91% 47%, rgba(34,211,238,0.18), transparent 0 12%)",
  },
  "thin-film": {
    id: "thin-film",
    route:
      "M 186 350 C 340 350, 430 352, 516 352 C 590 356, 660 382, 762 430 C 852 470, 960 520, 1118 548",
    label: "Thin film",
    labelX: 940,
    labelY: 520,
    labelWidth: 160,
    endpointX: 1114,
    endpointY: 548,
    spotlight:
      "radial-gradient(circle at 83% 75%, rgba(244,114,182,0.28), transparent 0 18%), radial-gradient(circle at 86% 79%, rgba(168,85,247,0.16), transparent 0 11%)",
  },
};

function endpointChipFill(category: HomeCategory, active: boolean) {
  return active ? `${category.accentFrom}20` : "rgba(3,7,18,0.72)";
}

function endpointChipStroke(category: HomeCategory, active: boolean) {
  return active ? `${category.accentFrom}aa` : "rgba(255,255,255,0.12)";
}

export default function PhotonicsHeroMap() {
  const router = useRouter();
  const [hovered, setHovered] = useState<BranchId | null>(null);
  const [selected, setSelected] = useState<BranchId>("spectroscopy");

  const categories = useMemo(
    () =>
      Object.fromEntries(featuredHeroCategories.map((category) => [category.id, category])) as Record<
        BranchId,
        HomeCategory
      >,
    []
  );

  const activeId = hovered ?? selected;
  const activeCategory = categories[activeId];

  const setActive = (id: BranchId) => setSelected(id);
  const openCategory = (id: BranchId) => router.push(categories[id].href);

  return (
    <div className="w-full">
      <div className="hidden lg:block">
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#050814] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero/photonics-hero-desktop.jpg"
              alt="Photonics hero concept showing an optical system splitting into three domains"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1280px) 700px, (min-width: 1024px) 56vw, 100vw"
            />
          </div>

          <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(3,7,18,0.14),rgba(3,7,18,0.08)_28%,rgba(3,7,18,0.12)_100%)]" />
          <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(90deg,rgba(4,7,18,0.12)_0%,transparent_28%,transparent_100%)]" />

          {hovered && (
            <>
              <div className="pointer-events-none absolute inset-0 z-20 bg-[#020611]/42 transition-opacity duration-300" />
              <div
                className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
                style={{ backgroundImage: branchGeometry[activeId].spotlight }}
              />
            </>
          )}

          <div className="pointer-events-none absolute inset-x-7 top-5 z-30 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-slate-400/85">
            <span>Interactive optical map</span>
            <span>Hover a channel</span>
          </div>

          <div className="relative z-30 aspect-[1280/698] w-full">
            <svg
              viewBox="0 0 1280 698"
              className="h-full w-full"
              fill="none"
              aria-labelledby="photonics-hero-title photonics-hero-desc"
            >
              <title id="photonics-hero-title">Interactive photonics hero</title>
              <desc id="photonics-hero-desc">
                A coherent beam enters from the left and splits toward spectroscopy, imaging, and thin-film
                calculator pathways.
              </desc>

              <defs>
                <filter id="beamGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="beamGlowStrong" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="11" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="beamInput" x1="52" y1="350" x2="238" y2="350" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" stopOpacity="0.18" />
                  <stop offset="0.25" stopColor="#7dd3fc" stopOpacity="0.72" />
                  <stop offset="0.62" stopColor="#f8fafc" stopOpacity="0.98" />
                  <stop offset="1" stopColor="#c4b5fd" stopOpacity="0.85" />
                </linearGradient>
                {featuredHeroCategories.map((category) => (
                  <linearGradient
                    key={category.id}
                    id={`route-${category.id}`}
                    x1="186"
                    y1="350"
                    x2="1132"
                    y2="350"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#e0f2fe" stopOpacity="0.92" />
                    <stop offset="0.26" stopColor="#dbeafe" stopOpacity="0.82" />
                    <stop offset="0.58" stopColor={category.accentFrom} stopOpacity="0.90" />
                    <stop offset="1" stopColor={category.accentTo} stopOpacity="0.96" />
                  </linearGradient>
                ))}
              </defs>

              <g>
                <path
                  d="M 58 350 L 186 350"
                  stroke="url(#beamInput)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#beamGlow)"
                />
                <path
                  d="M 58 350 L 186 350"
                  className="beam-flow"
                  stroke="#ffffff"
                  strokeOpacity="0.76"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeDasharray="18 24"
                />
              </g>

              {(Object.keys(branchGeometry) as BranchId[]).map((id) => {
                const branch = branchGeometry[id];
                const category = categories[id];
                const isActive = activeId === id;
                const isDimmed = hovered !== null && activeId !== id;

                return (
                  <g
                    key={id}
                    onMouseEnter={() => setHovered(id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(id)}
                    onBlur={() => setHovered(null)}
                    onClick={() => openCategory(id)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openCategory(id);
                      }
                    }}
                    className="cursor-pointer outline-none"
                  >
                    <path
                      d={branch.route}
                      stroke="#000"
                      strokeOpacity="0"
                      strokeWidth="42"
                      strokeLinecap="round"
                      onMouseEnter={() => setActive(id)}
                    />
                    <path
                      d={branch.route}
                      stroke={`url(#route-${id})`}
                      strokeOpacity={isDimmed ? 0.18 : 0.78}
                      strokeWidth={isActive ? 7.5 : 5.2}
                      strokeLinecap="round"
                      filter={isActive ? "url(#beamGlowStrong)" : "url(#beamGlow)"}
                    />
                    <path
                      d={branch.route}
                      stroke="#ffffff"
                      strokeOpacity={isActive ? 0.92 : 0}
                      strokeWidth={isActive ? 2.2 : 0}
                      strokeLinecap="round"
                      strokeDasharray="18 28"
                      className={isActive ? "beam-flow" : undefined}
                    />

                    <g opacity={isDimmed ? 0.45 : 1}>
                      <rect
                        x={branch.labelX}
                        y={branch.labelY}
                        width={branch.labelWidth}
                        height="40"
                        rx="999"
                        fill={endpointChipFill(category, isActive)}
                        stroke={endpointChipStroke(category, isActive)}
                      />
                      <text
                        x={branch.labelX + branch.labelWidth / 2}
                        y={branch.labelY + 25}
                        fill={isActive ? "#ffffff" : "#cbd5e1"}
                        fontSize="14"
                        fontWeight="600"
                        letterSpacing="0.16em"
                        textAnchor="middle"
                        style={{ textTransform: "uppercase" }}
                      >
                        {branch.label}
                      </text>
                      <circle
                        cx={branch.endpointX}
                        cy={branch.endpointY}
                        r={isActive ? 10 : 7}
                        fill={category.accentFrom}
                        fillOpacity={isActive ? 0.95 : 0.55}
                        filter={isActive ? "url(#beamGlowStrong)" : "url(#beamGlow)"}
                      />
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#050814] shadow-[0_24px_80px_rgba(0,0,0,0.40)]">
          <div className="relative aspect-[1280/698] w-full">
            <Image
              src="/hero/photonics-hero-desktop.jpg"
              alt="Photonics hero concept"
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.05),rgba(3,7,18,0.22))]" />
          </div>
          <div className="border-t border-white/10 bg-[#050814] p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(branchGeometry) as BranchId[]).map((id) => {
                const category = categories[id];
                const isActive = activeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActive(id)}
                    className="rounded-2xl border px-4 py-3 text-left transition"
                    style={{
                      borderColor: isActive ? `${category.accentFrom}88` : "rgba(255,255,255,0.10)",
                      background: isActive ? `${category.accentFrom}12` : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      {category.eyebrow}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">{category.title}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <CategoryDetailPanel category={activeCategory} />
      </div>

      <style jsx>{`
        .beam-flow {
          animation: beamShift 2.6s linear infinite;
        }

        @keyframes beamShift {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -78;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .beam-flow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
