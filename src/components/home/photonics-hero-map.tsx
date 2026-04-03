"use client";

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
  glowRoute?: string;
  labelX: number;
  labelY: number;
  endpointX: number;
  endpointY: number;
};

const branchGeometry: Record<BranchId, BranchConfig> = {
  spectroscopy: {
    id: "spectroscopy",
    route: "M 274 255 C 320 255, 342 250, 362 228 C 395 192, 462 150, 560 128 C 618 116, 676 112, 736 110",
    labelX: 676,
    labelY: 86,
    endpointX: 786,
    endpointY: 118,
  },
  imaging: {
    id: "imaging",
    route: "M 274 255 C 360 255, 468 255, 566 255 C 636 255, 696 255, 742 255",
    labelX: 690,
    labelY: 226,
    endpointX: 790,
    endpointY: 255,
  },
  "thin-film": {
    id: "thin-film",
    route: "M 274 255 C 320 255, 340 260, 362 282 C 402 322, 468 364, 566 390 C 624 406, 680 412, 736 410",
    labelX: 676,
    labelY: 444,
    endpointX: 784,
    endpointY: 404,
  },
};

function endpointFill(category: HomeCategory) {
  return `${category.accentFrom}12`;
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

  const setActive = (id: BranchId) => {
    setSelected(id);
  };

  const openCategory = (id: BranchId) => {
    router.push(categories[id].href);
  };

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,#18203a_0%,#090d18_38%,#04070f_100%)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(96,165,250,0.07),transparent_24%,transparent_76%,rgba(244,114,182,0.05))]" />
        <div className="pointer-events-none absolute inset-x-8 top-6 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-slate-500">
          <span>Interactive optical map</span>
          <span>Hover a branch</span>
        </div>

        <svg
          viewBox="0 0 960 520"
          className="relative z-10 mt-6 w-full"
          fill="none"
          aria-labelledby="photonics-hero-title photonics-hero-desc"
        >
          <title id="photonics-hero-title">Interactive photonics hero map</title>
          <desc id="photonics-hero-desc">
            A coherent beam enters from the left, routes through a coupler, and branches into spectroscopy, imaging,
            and thin-film domains.
          </desc>

          <defs>
            <filter id="beamGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="10" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="inputBeam" x1="20" y1="255" x2="320" y2="255" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="0.2" stopColor="#7dd3fc" stopOpacity="0.6" />
              <stop offset="0.55" stopColor="#e0f2fe" stopOpacity="1" />
              <stop offset="1" stopColor="#c4b5fd" stopOpacity="0.85" />
            </linearGradient>
            {featuredHeroCategories.map((category) => (
              <linearGradient
                key={category.id}
                id={`grad-${category.id}`}
                x1="274"
                y1="255"
                x2="790"
                y2="255"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#dbeafe" stopOpacity="0.9" />
                <stop offset="0.42" stopColor={category.accentFrom} stopOpacity="0.9" />
                <stop offset="1" stopColor={category.accentTo} stopOpacity="0.95" />
              </linearGradient>
            ))}
          </defs>

          <g opacity="0.22">
            <path d="M 120 58 L 210 88 L 310 74" stroke="#7dd3fc" strokeDasharray="4 10" />
            <path d="M 640 44 L 770 74 L 874 60" stroke="#f9a8d4" strokeDasharray="4 10" />
            <path d="M 80 468 L 196 428 L 312 442" stroke="#94a3b8" strokeDasharray="4 10" />
            <path d="M 608 454 L 702 432 L 880 460" stroke="#a78bfa" strokeDasharray="4 10" />
            <circle cx="152" cy="62" r="22" stroke="#334155" />
            <circle cx="818" cy="72" r="16" stroke="#334155" />
            <path d="M 696 94 l 28 -14 l 14 28" stroke="#334155" />
            <path d="M 772 432 l 30 14" stroke="#334155" />
          </g>

          <g>
            <circle cx="58" cy="255" r="18" fill="#020617" stroke="#3b82f6" strokeOpacity="0.35" />
            <circle cx="58" cy="255" r="8" fill="#7dd3fc" filter="url(#softGlow)" />
            <path d="M 76 255 L 198 255" stroke="url(#inputBeam)" strokeWidth="7" strokeLinecap="round" filter="url(#beamGlow)" />
            <path d="M 76 255 L 198 255" className="beam-flow" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="16 22" />
          </g>

          <g opacity="0.96">
            <rect x="198" y="214" width="92" height="82" rx="20" fill="#060b16" stroke="#334155" />
            <path d="M 214 255 C 232 255 238 240 250 230 C 264 218 274 218 286 230" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
            <path d="M 214 255 C 232 255 238 270 250 280 C 264 292 274 292 286 280" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" />
            <path d="M 234 239 L 254 271" stroke="#64748b" strokeWidth="2" opacity="0.7" />
            <path d="M 234 271 L 254 239" stroke="#64748b" strokeWidth="2" opacity="0.7" />
            <circle cx="244" cy="255" r="5" fill="#e2e8f0" opacity="0.9" />
          </g>

          {(Object.keys(branchGeometry) as BranchId[]).map((id) => {
            const branch = branchGeometry[id];
            const category = categories[id];
            const isActive = activeId === id;
            const isDimmed = activeId !== id;

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
                  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    setActive(id);
                  }
                }}
                className="cursor-pointer outline-none"
              >
                <path
                  d={branch.route}
                  stroke="#000"
                  strokeOpacity="0"
                  strokeWidth="28"
                  strokeLinecap="round"
                  onMouseEnter={() => setActive(id)}
                />
                <path
                  d={branch.route}
                  stroke={`url(#grad-${id})`}
                  strokeOpacity={isDimmed ? 0.28 : 0.95}
                  strokeWidth={isActive ? 6.5 : 4.4}
                  strokeLinecap="round"
                  filter={isActive ? "url(#beamGlow)" : undefined}
                />
                <path
                  d={branch.route}
                  stroke="#ffffff"
                  strokeOpacity={isActive ? 0.78 : 0}
                  strokeWidth={isActive ? 1.7 : 0}
                  strokeLinecap="round"
                  strokeDasharray="14 22"
                  className={isActive ? "beam-flow" : undefined}
                />

                <text
                  x={branch.labelX}
                  y={branch.labelY}
                  fill={isDimmed ? "#64748b" : "#e2e8f0"}
                  fontSize="13"
                  letterSpacing="0.26em"
                  textAnchor="end"
                  style={{ textTransform: "uppercase" }}
                >
                  {category.title}
                </text>
              </g>
            );
          })}

          <g
            opacity={activeId === "spectroscopy" ? 1 : 0.4}
            onMouseEnter={() => setActive("spectroscopy")}
            onClick={() => openCategory("spectroscopy")}
            role="link"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCategory("spectroscopy");
              }
            }}
            className="cursor-pointer"
          >
            <rect
              x="744"
              y="86"
              width="90"
              height="62"
              rx="16"
              fill={endpointFill(categories.spectroscopy)}
              stroke={categories.spectroscopy.accentFrom}
              strokeOpacity="0.45"
            />
            {Array.from({ length: 7 }).map((_, index) => (
              <line
                key={index}
                x1={760 + index * 8}
                y1="98"
                x2={768 + index * 8}
                y2="136"
                stroke="#94a3b8"
                strokeOpacity="0.55"
                strokeWidth="1.5"
              />
            ))}
            <path d="M 836 116 L 876 102" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" filter="url(#softGlow)" />
            <path d="M 836 116 L 882 116" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" filter="url(#softGlow)" />
            <path d="M 836 116 L 880 132" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" filter="url(#softGlow)" />
            <path d="M 896 92 L 928 92" stroke="#64748b" strokeWidth="2" />
            <path d="M 896 104 L 922 104" stroke="#60a5fa" strokeWidth="2" />
            <path d="M 896 116 L 924 116" stroke="#c084fc" strokeWidth="2" />
            <path d="M 896 128 L 914 128" stroke="#f472b6" strokeWidth="2" />
          </g>

          <g
            opacity={activeId === "imaging" ? 1 : 0.4}
            onMouseEnter={() => setActive("imaging")}
            onClick={() => openCategory("imaging")}
            role="link"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCategory("imaging");
              }
            }}
            className="cursor-pointer"
          >
            <rect
              x="748"
              y="223"
              width="98"
              height="64"
              rx="18"
              fill={endpointFill(categories.imaging)}
              stroke={categories.imaging.accentFrom}
              strokeOpacity="0.45"
            />
            <ellipse cx="770" cy="255" rx="9" ry="24" stroke="#7dd3fc" strokeWidth="2.2" />
            <ellipse cx="798" cy="255" rx="7" ry="19" stroke="#bae6fd" strokeWidth="2" />
            <line x1="818" y1="232" x2="818" y2="278" stroke="#64748b" strokeWidth="2" />
            <rect x="826" y="238" width="10" height="34" rx="2" fill="#60a5fa" fillOpacity="0.35" stroke="#60a5fa" strokeOpacity="0.6" />
            <path d="M 756 255 C 776 255 786 255 806 255" stroke="#e0f2fe" strokeOpacity="0.65" strokeWidth="1.6" strokeDasharray="5 8" />
          </g>

          <g
            opacity={activeId === "thin-film" ? 1 : 0.4}
            onMouseEnter={() => setActive("thin-film")}
            onClick={() => openCategory("thin-film")}
            role="link"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCategory("thin-film");
              }
            }}
            className="cursor-pointer"
          >
            <rect
              x="742"
              y="372"
              width="104"
              height="66"
              rx="18"
              fill={endpointFill(categories["thin-film"])}
              stroke={categories["thin-film"].accentFrom}
              strokeOpacity="0.45"
            />
            {[
              "#f8fafc",
              "#a78bfa",
              "#7dd3fc",
              "#f472b6",
              "#38bdf8",
            ].map((color, index) => (
              <rect key={color} x="760" y={386 + index * 8} width="46" height="5" rx="2" fill={color} fillOpacity="0.72" />
            ))}
            <path d="M 716 392 L 756 392" stroke="#e2e8f0" strokeWidth="2.3" strokeLinecap="round" />
            <path d="M 756 392 L 730 374" stroke="#f472b6" strokeWidth="2.1" strokeLinecap="round" filter="url(#softGlow)" />
            <path d="M 806 406 L 842 406" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" filter="url(#softGlow)" />
          </g>
        </svg>
      </div>

      <div className="mt-5">
        <CategoryDetailPanel category={activeCategory} />
      </div>

      <style jsx>{`
        .beam-flow {
          animation: beamShift 2.5s linear infinite;
        }

        @keyframes beamShift {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -72;
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
