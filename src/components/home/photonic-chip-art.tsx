import type { HeroBeamTheme, HeroPowerSplit } from "../../lib/hero-optics";

export type HeroHover = "spectral" | "imaging" | "interference" | "chip" | null;
export type HeroBranchKey = "spectral" | "imaging" | "interference";

export interface PhotonicChipArtProps {
  hovered: HeroHover;
  beam: HeroBeamTheme;
  split: HeroPowerSplit;
  /** Incremented on each chip click; re-mounts the input-beam burst. */
  pulseBurst: number;
  onHover: (branch: HeroHover) => void;
  onBranchClick: (branch: HeroBranchKey) => void;
  onChipClick: () => void;
}

/** Coordinates in the 1600 x 900 viewBox. */
const OPTICAL_PATHS = {
  inputBeam: "M 0 450 L 622 450",
  couplerLeft: { x: 622, y: 441, w: 72, h: 18, rx: 9 },
  chipUpperArm: "M 694 446 C 734 446, 738 399, 774 399 L 802 399",
  chipLowerArm: "M 694 454 C 734 454, 738 501, 774 501 L 802 501",
  chipUpperTrench: "M 600 434 L 700 434 C 732 434, 738 386, 772 386 L 882 386",
  chipLowerTrench: "M 600 466 L 700 466 C 732 466, 738 514, 772 514 L 882 514",
  couplerTopRight: { x: 802, y: 390, w: 68, h: 18, rx: 9 },
  couplerBottomRight: { x: 802, y: 492, w: 68, h: 18, rx: 9 },
  branchSpectralCladding:
    "M 870 395 L 948 395 C 990 395, 1000 375, 1028 334 L 1084 252 C 1106 220, 1122 217, 1152 217 L 1205 217",
  branchSpectralCore:
    "M 870 395 L 948 395 C 990 395, 1000 375, 1028 334 L 1084 252 C 1106 220, 1122 217, 1152 217 L 1227 217",
  branchImagingUpperMerge: "M 870 403 C 915 403, 932 450, 972 450",
  branchImagingLowerMerge: "M 870 497 C 915 497, 932 450, 972 450",
  branchImagingMain: "M 972 450 L 1390 450",
  branchInterferenceCladding:
    "M 870 505 L 948 505 C 990 505, 1000 525, 1028 566 L 1084 648 C 1106 680, 1122 680, 1152 680 L 1335 680",
  branchInterferenceCore:
    "M 870 505 L 948 505 C 990 505, 1000 525, 1028 566 L 1084 648 C 1106 680, 1122 680, 1152 680 L 1346 680",
};

/** Visual metadata of the three bays: label index, accent colour, bay rectangle and governing equation. */
export const HERO_BRANCH_VISUALS: Record<
  HeroBranchKey,
  {
    index: string;
    shortName: string;
    accentColor: string;
    rainbowColors?: string[];
    bayBounds: { x: number; y: number; w: number; h: number };
    anchorY: number;
    subtitle: string;
    formula: string;
    formulaLabel: string;
  }
> = {
  spectral: {
    index: "01",
    shortName: "Spectral & dispersion",
    accentColor: "#38bdf8",
    rainbowColors: ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00f2ff", "#5856d6", "#af52de"],
    bayBounds: { x: 1150, y: 100, w: 420, h: 230 },
    anchorY: 217,
    subtitle: "Grating dispersion · Sellmeier index · Wavenumber and photon energy",
    formula: "m · λ = d · (sin θᵢ + sin θₘ)",
    formulaLabel: "Grating equation",
  },
  imaging: {
    index: "02",
    shortName: "Imaging & Gaussian beam",
    accentColor: "#00f2ff",
    bayBounds: { x: 1150, y: 350, w: 420, h: 205 },
    anchorY: 450,
    subtitle: "Gaussian beams · Airy disk · Afocal relays",
    formula: "w(z) = w₀ · √[1 + (z / z_R)²]",
    formulaLabel: "Gaussian beam spot size",
  },
  interference: {
    index: "03",
    shortName: "Interference & waveguides",
    accentColor: "#a78bfa",
    bayBounds: { x: 1150, y: 572, w: 420, h: 205 },
    anchorY: 680,
    subtitle: "Etalon FSR · Fabry-Pérot filters · Waveguide modes",
    formula: "T = 1 / [1 + F · sin²(δ / 2)]",
    formulaLabel: "Fabry-Pérot (Airy) transmission",
  },
};

const BRANCH_KEYS: HeroBranchKey[] = ["spectral", "imaging", "interference"];
const BADGE_Y: Record<HeroBranchKey, number> = { spectral: 110, imaging: 356, interference: 578 };

interface Pad {
  id: string;
  x: number;
  y: number;
  angleDeg: number;
  color: string;
}

const spectrometerPads: Pad[] = (() => {
  const pads: Pad[] = [];
  const centerX = 1227;
  const centerY = 217;
  const colRadii = [212, 222, 232, 242, 252];
  const rainbow = ["#ff3b30", "#ff6226", "#ff9500", "#ffbf00", "#ffd60a", "#a6e22e", "#34c759", "#00f2ff", "#38bdf8", "#6366f1", "#8b5cf6", "#c084fc"];
  colRadii.forEach((r, colIdx) => {
    const numRows = 12;
    for (let row = 0; row < numRows; row++) {
      const norm = (row - (numRows - 1) / 2) / ((numRows - 1) / 2);
      const angleDeg = norm * 20.5;
      const angleRad = (angleDeg * Math.PI) / 180;
      pads.push({
        id: `pad-${colIdx}-${row}`,
        x: centerX + r * Math.cos(angleRad),
        y: centerY + r * Math.sin(angleRad),
        angleDeg,
        color: rainbow[row] ?? "#00f2ff",
      });
    }
  });
  return pads;
})();

interface Ray {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

const dispersionRays: Ray[] = (() => {
  const rays: Ray[] = [];
  const numRays = 25;
  const stops = [
    { pos: 0.0, color: "#ff2d20" },
    { pos: 0.18, color: "#ff8800" },
    { pos: 0.34, color: "#ffdd00" },
    { pos: 0.5, color: "#22c55e" },
    { pos: 0.68, color: "#00f2ff" },
    { pos: 0.84, color: "#4f46e5" },
    { pos: 1.0, color: "#a855f7" },
  ];
  const interpolateColor = (t: number): string => {
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].pos && t <= stops[i + 1].pos) return stops[i].color;
    }
    return stops[stops.length - 1].color;
  };
  const startX = 1227;
  const startY = 217;
  const radius = 207;
  for (let i = 0; i < numRays; i++) {
    const t = i / (numRays - 1);
    const angleRad = ((t - 0.5) * 39 * Math.PI) / 180;
    rays.push({
      id: `ray-${i}`,
      x1: startX,
      y1: startY,
      x2: startX + radius * Math.cos(angleRad),
      y2: startY + radius * Math.sin(angleRad),
      color: interpolateColor(t),
    });
  }
  return rays;
})();

interface Arc {
  index: number;
  leftPath: string;
  rightPath: string;
  baseOpacity: number;
}

const interferenceArcs: Arc[] = (() => {
  const arcs: Arc[] = [];
  const centerX = 1358;
  const centerY = 680;
  for (let i = 1; i <= 11; i++) {
    const r = 18 + i * 11.5;
    const a1 = (142 * Math.PI) / 180;
    const a2 = (218 * Math.PI) / 180;
    const lx1 = centerX - 14 + r * Math.cos(a1);
    const ly1 = centerY + r * Math.sin(a1);
    const lx2 = centerX - 14 + r * Math.cos(a2);
    const ly2 = centerY + r * Math.sin(a2);
    const b1 = (-38 * Math.PI) / 180;
    const b2 = (38 * Math.PI) / 180;
    const rx1 = centerX + 18 + r * Math.cos(b1);
    const ry1 = centerY + r * Math.sin(b1);
    const rx2 = centerX + 18 + r * Math.cos(b2);
    const ry2 = centerY + r * Math.sin(b2);
    arcs.push({
      index: i,
      leftPath: `M ${lx1.toFixed(1)} ${ly1.toFixed(1)} A ${r} ${r} 0 0 1 ${lx2.toFixed(1)} ${ly2.toFixed(1)}`,
      rightPath: `M ${rx1.toFixed(1)} ${ry1.toFixed(1)} A ${r} ${r} 0 0 1 ${rx2.toFixed(1)} ${ry2.toFixed(1)}`,
      baseOpacity: Math.max(0.06, 0.58 * (1 - i / 12.5)),
    });
  }
  return arcs;
})();

/**
 * The chip schematic: pure presentation, no state. Decorative (aria-hidden); the same destinations are reachable
 * through the links around it. Animations and the parallax transform come from the `hero-*` CSS classes.
 */
export default function PhotonicChipArt({
  hovered: hoveredBranch,
  beam: beamTheme,
  split,
  pulseBurst,
  onHover,
  onBranchClick,
  onChipClick,
}: PhotonicChipArtProps) {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid meet"
      className="hero-art block h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Anodized Metallic Chassis Gradients */}
        <linearGradient id="panelBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0b0d12" />
          <stop offset="45%" stopColor="#10141c" />
          <stop offset="100%" stopColor="#0d1017" />
        </linearGradient>

        <linearGradient id="baySurfaceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#12161f" />
          <stop offset="50%" stopColor="#161b26" />
          <stop offset="100%" stopColor="#11151e" />
        </linearGradient>

        <linearGradient id="chipHousingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1c212d" />
          <stop offset="15%" stopColor="#12161f" />
          <stop offset="85%" stopColor="#0e1118" />
          <stop offset="100%" stopColor="#191e29" />
        </linearGradient>

        <linearGradient id="chipInnerIsland" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#181c26" />
          <stop offset="100%" stopColor="#10131b" />
        </linearGradient>

        {/* MZI Electro-Optic Phase Transition Gradient (Cyan -> Violet/Magenta -> Cyan) */}
        <linearGradient id="mziPhaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={beamTheme.glow} />
          <stop offset="30%" stopColor="#a78bfa" />
          <stop offset="65%" stopColor="#9333ea" />
          <stop offset="92%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor={beamTheme.glow} />
        </linearGradient>

        <linearGradient id="mziCoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#ddd6fe" />
          <stop offset="75%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* 3D Glass Lens Gradients for Middle Bay */}
        <linearGradient id="glassLensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.45" />
          <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.18" />
          <stop offset="70%" stopColor="#0f172a" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.4" />
        </linearGradient>

        <linearGradient id="glassLensRim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#64748b" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#334155" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.8" />
        </linearGradient>

        {/* Gaussian Beam Caustic Envelope Gradient */}
        <linearGradient id="causticBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={beamTheme.glow} stopOpacity="0.32" />
          <stop offset="30%" stopColor={beamTheme.glow} stopOpacity="0.18" />
          <stop offset="65%" stopColor={beamTheme.glow} stopOpacity="0.38" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.28" />
        </linearGradient>

        {/* 2D Sensor Iridescent Heatmap Gradient */}
        <radialGradient id="sensorIridescentGrad" cx="42%" cy="48%" r="65%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#0284c7" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#7e22ce" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
        </radialGradient>

        {/* Diffraction Grating Metallic Bar Gradient */}
        <linearGradient id="gratingMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#262c3a" />
          <stop offset="55%" stopColor="#475569" />
          <stop offset="85%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Etalon Plate Glass Gradient */}
        <linearGradient id="etalonPlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.75" />
        </linearGradient>

        {/* Glow Filters for Laser Paths, Grating Point, and Amber SMD LEDs */}
        <filter id="cyanOuterGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" result="blur1" />
          <feGaussianBlur stdDeviation="3.5" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="cyanIntenseGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" result="blur1" />
          <feGaussianBlur stdDeviation="5" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="amberLedGlow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="5" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="softDropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.65" />
        </filter>
      </defs>

      {/* =================================================================
          1. ARCHITECTURAL DARK METALLIC PANELS & RECESSED SEAMS
         ================================================================= */}
      <rect x="0" y="0" width="1600" height="900" fill="url(#panelBaseGrad)" />

      {/* Right-side Module Bay Recessed Surfaces */}
      <rect
        x="1150"
        y="101"
        width="420"
        height="230"
        fill="url(#baySurfaceGrad)"
        opacity={hoveredBranch === "spectral" ? 1 : 0.85}
      />
      <rect
        x="1150"
        y="350"
        width="420"
        height="205"
        fill="url(#baySurfaceGrad)"
        opacity={hoveredBranch === "imaging" ? 1 : 0.85}
      />
      <rect
        x="1150"
        y="572"
        width="420"
        height="205"
        fill="url(#baySurfaceGrad)"
        opacity={hoveredBranch === "interference" ? 1 : 0.85}
      />

      {/* Main Vertical & Horizontal Panel Seams (Dark trench + 1px specular highlight) */}
      <g strokeWidth="1.5">
        {/* Vertical seams */}
        <line x1="200" y1="0" x2="200" y2="900" stroke="#05070a" />
        <line x1="201.5" y1="0" x2="201.5" y2="900" stroke="#1e2534" strokeOpacity="0.55" />

        <line x1="550" y1="0" x2="550" y2="900" stroke="#05070a" />
        <line x1="551.5" y1="0" x2="551.5" y2="900" stroke="#1e2534" strokeOpacity="0.55" />

        <line x1="914" y1="0" x2="914" y2="900" stroke="#05070a" />
        <line x1="915.5" y1="0" x2="915.5" y2="900" stroke="#1e2534" strokeOpacity="0.6" />

        <line x1="1150" y1="0" x2="1150" y2="900" stroke="#040508" strokeWidth="2.5" />
        <line x1="1152" y1="0" x2="1152" y2="900" stroke="#252e40" strokeOpacity="0.7" />

        <line x1="1570" y1="0" x2="1570" y2="900" stroke="#040508" strokeWidth="2" />
        <line x1="1571.5" y1="0" x2="1571.5" y2="900" stroke="#222a3a" strokeOpacity="0.6" />

        {/* Left horizontal seams */}
        <line x1="0" y1="305" x2="550" y2="305" stroke="#06080c" />
        <line x1="0" y1="306.5" x2="550" y2="306.5" stroke="#1b2230" strokeOpacity="0.45" />

        <line x1="0" y1="595" x2="550" y2="595" stroke="#06080c" />
        <line x1="0" y1="596.5" x2="550" y2="596.5" stroke="#1b2230" strokeOpacity="0.45" />

        {/* Right bay horizontal divider trenches */}
        {[101, 331, 350, 555, 572, 777].map((yPos) => (
          <g key={yPos}>
            <line x1="914" y1={yPos} x2="1600" y2={yPos} stroke="#040609" strokeWidth="2" />
            <line x1="914" y1={yPos + 1.5} x2="1600" y2={yPos + 1.5} stroke="#232c3d" strokeOpacity="0.65" />
          </g>
        ))}
      </g>

      {/* =================================================================
          2. SUBTLE CAD TECHNICAL SCHEMATIC MARKINGS (From Reference Image)
         ================================================================= */}
      <g stroke="#475569" strokeOpacity="0.28" strokeWidth="1" fill="none">
        {/* Top-center schematic above the PIC splitter (x: 730..900, y: 280..346) */}
        <line x1="735" y1="285" x2="914" y2="285" />
        <line x1="735" y1="312" x2="890" y2="312" />
        <line x1="775" y1="280" x2="775" y2="346" />
        <line x1="815" y1="280" x2="815" y2="346" />
        <line x1="848" y1="280" x2="848" y2="346" />
        <path d="M 790 342 C 815 342, 825 295, 848 295" strokeDasharray="3 2" />
        <path d="M 815 325 L 882 325 L 870 315 M 882 325 L 870 335" />

        {/* Bottom-center schematic below the PIC splitter (x: 550..914, y: 554..630) */}
        <line x1="550" y1="572" x2="914" y2="572" />
        <line x1="550" y1="620" x2="914" y2="620" />
        <ellipse cx="852" cy="596" rx="28" ry="15" />
        <ellipse cx="852" cy="596" rx="14" ry="22" strokeDasharray="2 2" />
        <line x1="810" y1="596" x2="895" y2="596" />
        <line x1="852" y1="566" x2="852" y2="626" />
        <path d="M 780 572 C 795 572, 800 596, 818 596" />

        {/* Top-right header schematic above Spectral Bay */}
        <rect x="935" y="12" width="195" height="75" />
        <line x1="914" y1="88" x2="1150" y2="88" />
        <line x1="926" y1="78" x2="926" y2="98" />

        {/* Bottom-right footer schematic grid below Interference Bay */}
        <line x1="914" y1="792" x2="1570" y2="792" />
        <line x1="914" y1="812" x2="1570" y2="812" />
        <line x1="914" y1="845" x2="1570" y2="845" />
        {[955, 975, 1060, 1085, 1150, 1345].map((gx) => (
          <line key={gx} x1={gx} y1="777" x2={gx} y2="900" />
        ))}
      </g>

      {/* =================================================================
          3. CENTRAL OPTICAL ROUTING / SPLITTER PIC HOUSING (Mach-Zehnder)
         ================================================================= */}
      <g
        className="cursor-pointer"
        onMouseEnter={() => onHover("chip")}
        onMouseLeave={() => onHover(null)}
        onClick={onChipClick}
      >
        {/* Outer raised chip package with beveled frame */}
        <rect
          x="550"
          y="346"
          width="364"
          height="208"
          rx="4"
          fill="url(#chipHousingGrad)"
          stroke={hoveredBranch === "chip" ? "#38bdf8" : "#262f42"}
          strokeWidth={hoveredBranch === "chip" ? "2" : "1.5"}
          filter="url(#softDropShadow)"
        />

        {/* Inner recessed chip cavity */}
        <rect
          x="574"
          y="366"
          width="322"
          height="168"
          rx="6"
          fill="#0b0e14"
          stroke="#1e2536"
          strokeWidth="1"
        />

        {/* Upper, Middle, and Lower internal silicon islands matching the reference chip geometry */}
        {/* Center island between upper and lower MZI arms */}
        <path
          d="M 730 450 C 745 450, 755 418, 780 418 L 892 418 L 892 482 L 780 482 C 755 482, 745 450, 730 450 Z"
          fill="url(#chipInnerIsland)"
          stroke="#22293a"
          strokeWidth="1.2"
        />

        {/* Subtle violet/magenta phase-shifter electrode glow inside the central chip */}
        <path
          d={OPTICAL_PATHS.chipUpperTrench}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="3"
          strokeOpacity={hoveredBranch === "chip" ? "0.75" : "0.42"}
        />
        <path
          d={OPTICAL_PATHS.chipLowerTrench}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="3"
          strokeOpacity={hoveredBranch === "chip" ? "0.75" : "0.42"}
        />

        {/* Two Amber SMD Status LEDs on the right corners of the PIC splitter package */}
        <rect
          x="895"
          y="358"
          width="9"
          height="5"
          rx="1.5"
          fill="#ffbe2e"
          filter="url(#amberLedGlow)"
        />
        <rect
          x="895"
          y="537"
          width="9"
          height="5"
          rx="1.5"
          fill="#ffbe2e"
          filter="url(#amberLedGlow)"
        />

        {/* MMI Coupler Pill Outlines */}
        {[
          OPTICAL_PATHS.couplerLeft,
          OPTICAL_PATHS.couplerTopRight,
          OPTICAL_PATHS.couplerBottomRight
        ].map((pill, idx) => (
          <rect
            key={idx}
            x={pill.x}
            y={pill.y}
            width={pill.w}
            height={pill.h}
            rx={pill.rx}
            fill="#101520"
            stroke="#64748b"
            strokeWidth="1.4"
            strokeOpacity="0.65"
          />
        ))}
      </g>

      {/* =================================================================
          4. WAVEGUIDE CLADDING CHANNELS & GLOWING OPTICAL BEAMS
         ================================================================= */}
      {/* Translucent glass waveguide cladding tracks for the 3 branches */}
      <g fill="none" strokeLinecap="round">
        {/* Input waveguide trench */}
        <path d="M 0 450 L 622 450" stroke="#070a0f" strokeWidth="14" />
        <path d="M 0 450 L 622 450" stroke="#1e293b" strokeWidth="10" strokeOpacity="0.45" />

        {/* Top Branch Cladding Track */}
        <path
          d={OPTICAL_PATHS.branchSpectralCladding}
          stroke="#1e293b"
          strokeWidth="22"
          strokeOpacity="0.55"
        />
        <path
          d={OPTICAL_PATHS.branchSpectralCladding}
          stroke="#38bdf8"
          strokeWidth="18"
          strokeOpacity={hoveredBranch === "spectral" ? "0.22" : "0.09"}
        />

        {/* Middle Branch Cladding Track */}
        <path
          d={OPTICAL_PATHS.branchImagingUpperMerge}
          stroke="#1e293b"
          strokeWidth="14"
          strokeOpacity="0.5"
        />
        <path
          d={OPTICAL_PATHS.branchImagingLowerMerge}
          stroke="#1e293b"
          strokeWidth="14"
          strokeOpacity="0.5"
        />
        <path
          d="M 965 450 L 1188 450"
          stroke="#1e293b"
          strokeWidth="16"
          strokeOpacity="0.5"
        />

        {/* Bottom Branch Cladding Track */}
        <path
          d={OPTICAL_PATHS.branchInterferenceCladding}
          stroke="#1e293b"
          strokeWidth="22"
          strokeOpacity="0.55"
        />
        <path
          d={OPTICAL_PATHS.branchInterferenceCladding}
          stroke="#38bdf8"
          strokeWidth="18"
          strokeOpacity={hoveredBranch === "interference" ? "0.22" : "0.09"}
        />
      </g>

      {/* --- LEFT INPUT OPTICAL BEAM --- */}
      <g filter="url(#cyanOuterGlow)">
        <path
          d={OPTICAL_PATHS.inputBeam}
          stroke={beamTheme.glow}
          strokeWidth="7"
          strokeOpacity="0.65"
          fill="none"
        />
        <path
          d={OPTICAL_PATHS.inputBeam}
          stroke={beamTheme.core}
          strokeWidth="2.8"
          fill="none"
        />
        {/* Animated Photon Wave Packets on Input Beam */}
        <path
          d={OPTICAL_PATHS.inputBeam}
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeDasharray="18 102"
          className="hero-photon"
          fill="none"
        />
        {/* One bright pulse per chip click */}
        {pulseBurst > 0 && (
          <path
            key={pulseBurst}
            d={OPTICAL_PATHS.inputBeam}
            stroke="#ffffff"
            strokeWidth="6"
            strokeDasharray="60 700"
            className="hero-burst"
            fill="none"
          />
        )}
      </g>

      {/* --- CENTRAL CHIP MZI INTERFEROMETER ARMS --- */}
      <g filter="url(#cyanOuterGlow)" fill="none" strokeLinecap="round">
        {/* Outer Bloom */}
        <path d={OPTICAL_PATHS.chipUpperArm} stroke="url(#mziPhaseGrad)" strokeWidth="6.5" strokeOpacity="0.8" />
        <path d={OPTICAL_PATHS.chipLowerArm} stroke="url(#mziPhaseGrad)" strokeWidth="6.5" strokeOpacity="0.8" />
        {/* Hot Inner Core */}
        <path d={OPTICAL_PATHS.chipUpperArm} stroke="url(#mziCoreGrad)" strokeWidth="2.3" />
        <path d={OPTICAL_PATHS.chipLowerArm} stroke="url(#mziCoreGrad)" strokeWidth="2.3" />
        {/* Flowing Phase Pulses inside the chip */}
        <path
          d={OPTICAL_PATHS.chipUpperArm}
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeDasharray="12 68"
          className="hero-photon"
        />
        <path
          d={OPTICAL_PATHS.chipLowerArm}
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeDasharray="12 68"
          className="hero-photon"
        />
      </g>

      {/* --- TOP BRANCH WAVEGUIDE (PORT 01: SPECTRAL) --- */}
      <g
        className="cursor-pointer"
        onMouseEnter={() => onHover("spectral")}
        onMouseLeave={() => onHover(null)}
        onClick={() => onBranchClick("spectral")}
        filter={hoveredBranch === "spectral" ? "url(#cyanIntenseGlow)" : "url(#cyanOuterGlow)"}
        fill="none"
        strokeLinecap="round"
        opacity={
          hoveredBranch && hoveredBranch !== "spectral" && hoveredBranch !== "chip"
            ? 0.48
            : 0.55 + split.spectral * 0.9
        }
      >
        <path
          d={OPTICAL_PATHS.branchSpectralCore}
          stroke={beamTheme.glow}
          strokeWidth={hoveredBranch === "spectral" ? "8.5" : "6"}
          strokeOpacity="0.75"
        />
        <path
          d={OPTICAL_PATHS.branchSpectralCore}
          stroke="#ffffff"
          strokeWidth={hoveredBranch === "spectral" ? "3.2" : "2.2"}
        />
        <path
          d={OPTICAL_PATHS.branchSpectralCore}
          stroke="#ffffff"
          strokeWidth="3.6"
          strokeDasharray="16 104"
          className={hoveredBranch === "spectral" ? "hero-photon-fast" : "hero-photon"}
        />
      </g>

      {/* --- MIDDLE BRANCH WAVEGUIDE (PORT 02: IMAGING & LENS TRAIN) --- */}
      <g
        className="cursor-pointer"
        onMouseEnter={() => onHover("imaging")}
        onMouseLeave={() => onHover(null)}
        onClick={() => onBranchClick("imaging")}
        filter={hoveredBranch === "imaging" ? "url(#cyanIntenseGlow)" : "url(#cyanOuterGlow)"}
        fill="none"
        strokeLinecap="round"
        opacity={
          hoveredBranch && hoveredBranch !== "imaging" && hoveredBranch !== "chip"
            ? 0.48
            : 0.55 + split.imaging * 0.9
        }
      >
        <path
          d={OPTICAL_PATHS.branchImagingUpperMerge}
          stroke={beamTheme.glow}
          strokeWidth={hoveredBranch === "imaging" ? "7.5" : "5.5"}
          strokeOpacity="0.75"
        />
        <path
          d={OPTICAL_PATHS.branchImagingLowerMerge}
          stroke={beamTheme.glow}
          strokeWidth={hoveredBranch === "imaging" ? "7.5" : "5.5"}
          strokeOpacity="0.75"
        />
        <path
          d={OPTICAL_PATHS.branchImagingMain}
          stroke={beamTheme.glow}
          strokeWidth={hoveredBranch === "imaging" ? "8" : "5.5"}
          strokeOpacity="0.75"
        />
        <path d={OPTICAL_PATHS.branchImagingUpperMerge} stroke="#ffffff" strokeWidth="2.1" />
        <path d={OPTICAL_PATHS.branchImagingLowerMerge} stroke="#ffffff" strokeWidth="2.1" />
        <path
          d={OPTICAL_PATHS.branchImagingMain}
          stroke="#ffffff"
          strokeWidth={hoveredBranch === "imaging" ? "3" : "2.1"}
        />
        <path
          d={OPTICAL_PATHS.branchImagingMain}
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeDasharray="16 104"
          className={hoveredBranch === "imaging" ? "hero-photon-fast" : "hero-photon"}
        />
      </g>

      {/* --- BOTTOM BRANCH WAVEGUIDE (PORT 03: INTERFERENCE) --- */}
      <g
        className="cursor-pointer"
        onMouseEnter={() => onHover("interference")}
        onMouseLeave={() => onHover(null)}
        onClick={() => onBranchClick("interference")}
        filter={hoveredBranch === "interference" ? "url(#cyanIntenseGlow)" : "url(#cyanOuterGlow)"}
        fill="none"
        strokeLinecap="round"
        opacity={
          hoveredBranch && hoveredBranch !== "interference" && hoveredBranch !== "chip"
            ? 0.48
            : 0.55 + split.interference * 0.9
        }
      >
        <path
          d={OPTICAL_PATHS.branchInterferenceCore}
          stroke={beamTheme.glow}
          strokeWidth={hoveredBranch === "interference" ? "8.5" : "6"}
          strokeOpacity="0.75"
        />
        <path
          d={OPTICAL_PATHS.branchInterferenceCore}
          stroke="#ffffff"
          strokeWidth={hoveredBranch === "interference" ? "3.2" : "2.2"}
        />
        <path
          d={OPTICAL_PATHS.branchInterferenceCore}
          stroke="#ffffff"
          strokeWidth="3.6"
          strokeDasharray="16 104"
          className={hoveredBranch === "interference" ? "hero-photon-fast" : "hero-photon"}
        />
      </g>

      {/* =================================================================
          5. RIGHT-SIDE MODULE 1: TOP SPECTRAL DISPERSION & GRATING ARRAY
         ================================================================= */}
      <g
        className="cursor-pointer"
        onMouseEnter={() => onHover("spectral")}
        onMouseLeave={() => onHover(null)}
        onClick={() => onBranchClick("spectral")}
      >
        {/* Invisible interactive hit area for the entire top bay */}
        <rect x="1150" y="101" width="420" height="230" fill="transparent" />

        {/* Bay 1 Top-Left Amber SMD Status LED */}
        <rect
          x="1158"
          y="112"
          width="9"
          height="5"
          rx="1.5"
          fill="#ffbe2e"
          filter="url(#amberLedGlow)"
        />

        {/* Grating Mounting Base Plate */}
        <rect
          x="1198"
          y="156"
          width="34"
          height="122"
          rx="2"
          fill="#11151e"
          stroke="#283142"
          strokeWidth="1"
        />

        {/* 3D Metallic Blazed Diffraction Grating with Sawtooth Grooves */}
        <path
          d="M 1206 164 L 1223 164 L 1228 168 L 1222 172 L 1228 176 L 1222 180 L 1228 184 L 1222 188 L 1228 192 L 1222 196 L 1228 200 L 1222 204 L 1228 208 L 1222 212 L 1228 216 L 1222 220 L 1228 224 L 1222 228 L 1228 232 L 1222 236 L 1228 240 L 1222 244 L 1228 248 L 1222 252 L 1228 256 L 1222 260 L 1228 264 L 1222 268 L 1206 268 Z"
          fill="url(#gratingMetalGrad)"
          stroke="#94a3b8"
          strokeWidth="0.9"
          filter="url(#softDropShadow)"
        />

        {/* Continuous Rainbow Fan Shimmer Underlay */}
        <g
          opacity={hoveredBranch === "spectral" ? 0.98 : 0.82}
          className="transition-opacity duration-300"
        >
          {dispersionRays.map((ray, idx) => (
            <g key={ray.id}>
              {/* Soft spectral bloom ray */}
              <line
                x1={ray.x1}
                y1={ray.y1}
                x2={ray.x2}
                y2={ray.y2}
                stroke={ray.color}
                strokeWidth={hoveredBranch === "spectral" ? "4.5" : "3.2"}
                strokeOpacity="0.28"
              />
              {/* Crisp individual dispersed wavelength ray */}
              <line
                x1={ray.x1}
                y1={ray.y1}
                x2={ray.x2}
                y2={ray.y2}
                stroke={ray.color}
                strokeWidth={hoveredBranch === "spectral" ? "1.8" : "1.3"}
                strokeOpacity="0.92"
              />
              {/* Animated spectral photon pulse when hovered */}
              {hoveredBranch === "spectral" && idx % 2 === 0 && (
                <line
                  x1={ray.x1}
                  y1={ray.y1}
                  x2={ray.x2}
                  y2={ray.y2}
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeDasharray="10 70"
                  className="hero-photon-fast"
                />
              )}
            </g>
          ))}
        </g>

        {/* Intense White-Cyan Focal Point Flare on the Grating Tooth */}
        <circle
          cx="1227"
          cy="217"
          r={hoveredBranch === "spectral" ? "7" : "5"}
          fill="#ffffff"
          filter="url(#cyanIntenseGlow)"
        />

        {/* Curved Spectrometer Photodiode Array Substrate */}
        <path
          d="M 1424 134 A 212 212 0 0 1 1424 300 L 1468 308 A 258 258 0 0 0 1468 126 Z"
          fill="#1e2433"
          fillOpacity="0.7"
          stroke="#475569"
          strokeWidth="1.2"
          filter="url(#softDropShadow)"
        />

        {/* 5x12 Curved Matrix of Metallic Spectrometer Detector Pads */}
        {spectrometerPads.map((pad) => (
          <rect
            key={pad.id}
            x={pad.x - 3}
            y={pad.y - 2.2}
            width="6"
            height="4.4"
            rx="0.8"
            transform={`rotate(${pad.angleDeg}, ${pad.x}, ${pad.y})`}
            fill={hoveredBranch === "spectral" ? pad.color : "#1e293b"}
            fillOpacity={hoveredBranch === "spectral" ? 0.75 : 0.9}
            stroke={hoveredBranch === "spectral" ? "#ffffff" : "#94a3b8"}
            strokeWidth="0.7"
            strokeOpacity={hoveredBranch === "spectral" ? 0.9 : 0.65}
          />
        ))}
      </g>

      {/* =================================================================
          6. RIGHT-SIDE MODULE 2: MIDDLE LENS TRAIN & FOCAL PLANE SENSOR
         ================================================================= */}
      <g
        className="cursor-pointer"
        onMouseEnter={() => onHover("imaging")}
        onMouseLeave={() => onHover(null)}
        onClick={() => onBranchClick("imaging")}
      >
        {/* Invisible interactive hit area for the middle bay */}
        <rect x="1150" y="350" width="420" height="205" fill="transparent" />

        {/* Bay 2 Amber SMD Status LEDs */}
        <rect
          x="1158"
          y="340"
          width="9"
          height="4.5"
          rx="1.5"
          fill="#ffbe2e"
          filter="url(#amberLedGlow)"
        />
        <rect
          x="1158"
          y="359"
          width="9"
          height="4.5"
          rx="1.5"
          fill="#ffbe2e"
          filter="url(#amberLedGlow)"
        />

        {/* Technical CAD Dimension Lines & Labels matching reference image */}
        <g stroke="#64748b" strokeOpacity="0.45" strokeWidth="0.9" fill="none">
          {/* Top dimension ticks for lenses and detector */}
          <path d="M 1246 418 L 1246 376 L 1292 376 L 1292 405" />
          <path d="M 1312 392 L 1312 376 L 1435 376 L 1435 390" />
          {/* Bottom focal point callout */}
          <path d="M 1188 492 L 1188 525 L 1296 525" />
          <line x1="1296" y1="455" x2="1296" y2="532" strokeDasharray="2 2" />
          {/* Corner alignment brackets around sensor */}
          <path d="M 1378 396 L 1378 386 L 1388 386" />
          <path d="M 1492 386 L 1502 386 L 1502 396" />
          <path d="M 1378 504 L 1378 514 L 1388 514" />
          <path d="M 1492 514 L 1502 514 L 1502 504" />
        </g>
        <g fill="#64748b" fillOpacity="0.75" className="hidden font-mono text-[9px] tracking-wider xl:block">
          <text x="1432" y="371">detector array</text>
          <text x="1302" y="528">focal point</text>
        </g>

        {/* Translucent Cyan Gaussian Beam Caustic Envelopes Between Lenses */}
        <g
          opacity={hoveredBranch === "imaging" ? 1 : 0.78}
          className="transition-opacity duration-300"
        >
          {/* Envelope 1: Plano-convex lens (x=1195) converging to intermediate waist (x=1225) then to Lens 2 (x=1246) */}
          <path
            d="M 1192 414 L 1224 443 L 1246 426 L 1246 474 L 1224 457 L 1192 486 Z"
            fill="url(#causticBeamGrad)"
            stroke="#38bdf8"
            strokeOpacity="0.4"
            strokeWidth="0.8"
          />
          {/* Envelope 2: Lens 2 (x=1246) converging to focal waist (x=1272) then expanding to Lens 3 (x=1295) */}
          <path
            d="M 1248 426 L 1272 444 L 1295 418 L 1295 482 L 1272 456 L 1248 474 Z"
            fill="url(#causticBeamGrad)"
            stroke="#38bdf8"
            strokeOpacity="0.45"
            strokeWidth="0.8"
          />
          {/* Envelope 3: Lens 3 (x=1295) expanding to Large Lens 4 (x=1330) */}
          <path
            d="M 1297 418 L 1330 400 L 1330 500 L 1297 482 Z"
            fill="url(#causticBeamGrad)"
          />
          {/* Envelope 4: Large Lens 4 (x=1330) converging onto the 2D Detector Face (x=1390) */}
          <path
            d="M 1332 400 L 1390 412 L 1390 488 L 1332 500 Z"
            fill="url(#causticBeamGrad)"
            stroke="#38bdf8"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
        </g>

        {/* 4-Element 3D Glass Optical Lens Train */}
        {/* Lens 1: Plano-Convex Input Singlet (x ≈ 1190) */}
        <g
          transform={`translate(${hoveredBranch === "imaging" ? -2 : 0}, 0)`}
          className="transition-transform duration-500"
        >
          <path
            d="M 1188 410 L 1194 410 A 48 48 0 0 1 1194 490 L 1188 490 Z"
            fill="url(#glassLensGrad)"
            stroke="#7dd3fc"
            strokeWidth="1.1"
            strokeOpacity="0.7"
          />
          <ellipse cx="1188" cy="450" rx="3" ry="40" fill="url(#glassLensRim)" stroke="#94a3b8" strokeWidth="0.7" />
        </g>

        {/* Lens 2: Biconcave Relay Element (x ≈ 1246) */}
        <g
          transform={`translate(${hoveredBranch === "imaging" ? 3 : 0}, 0)`}
          className="transition-transform duration-500"
        >
          <ellipse cx="1242" cy="450" rx="6" ry="26" fill="url(#glassLensRim)" stroke="#64748b" strokeWidth="0.9" />
          <ellipse cx="1250" cy="450" rx="6" ry="26" fill="url(#glassLensGrad)" stroke="#7dd3fc" strokeWidth="1" />
        </g>

        {/* Lens 3: Medium Biconvex Element (x ≈ 1295) */}
        <g
          transform={`translate(${hoveredBranch === "imaging" ? -2.5 : 0}, 0)`}
          className="transition-transform duration-500"
        >
          <ellipse cx="1291" cy="450" rx="7" ry="34" fill="url(#glassLensRim)" stroke="#64748b" strokeWidth="0.9" />
          <ellipse cx="1298" cy="450" rx="7" ry="34" fill="url(#glassLensGrad)" stroke="#7dd3fc" strokeWidth="1.1" />
        </g>

        {/* Lens 4: Large Focusing Objective Element (x ≈ 1330) */}
        <g
          transform={`translate(${hoveredBranch === "imaging" ? 2 : 0}, 0)`}
          className="transition-transform duration-500"
        >
          <ellipse cx="1327" cy="450" rx="8" ry="52" fill="url(#glassLensRim)" stroke="#64748b" strokeWidth="1" />
          <ellipse cx="1333" cy="450" rx="8" ry="52" fill="url(#glassLensGrad)" stroke="#bae6fd" strokeWidth="1.2" />
        </g>

        {/* Square 2D Focal Plane Detector Array (CMOS / InGaAs Sensor) */}
        <g filter="url(#softDropShadow)">
          {/* Outer ceramic/metal sensor package */}
          <rect
            x="1386"
            y="394"
            width="96"
            height="112"
            rx="2"
            fill="#141822"
            stroke="#475569"
            strokeWidth="1.4"
          />
          {/* Active pixel array die */}
          <rect
            x="1393"
            y="401"
            width="82"
            height="98"
            fill="url(#sensorIridescentGrad)"
            stroke="#38bdf8"
            strokeWidth="0.9"
            strokeOpacity="0.8"
          />
          {/* Fine 2D Pixel Grid Lines inside Sensor */}
          <g stroke="#0f172a" strokeOpacity="0.55" strokeWidth="0.6">
            {Array.from({ length: 15 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={1398 + i * 5.2}
                y1="401"
                x2={1398 + i * 5.2}
                y2="499"
              />
            ))}
            {Array.from({ length: 18 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1="1393"
                y1={406 + i * 5.2}
                x2="1475"
                y2={406 + i * 5.2}
              />
            ))}
          </g>
          {/* Live Focused Gaussian Airy Spot Bloom on Sensor Center */}
          <circle
            cx="1424"
            cy="446"
            r={hoveredBranch === "imaging" ? "26" : "18"}
            fill="#00f2ff"
            fillOpacity={hoveredBranch === "imaging" ? "0.45" : "0.25"}
            filter="url(#cyanOuterGlow)"
          />
          <circle
            cx="1424"
            cy="446"
            r={hoveredBranch === "imaging" ? "6" : "3.5"}
            fill="#ffffff"
            filter="url(#cyanOuterGlow)"
          />
        </g>
      </g>

      {/* =================================================================
          7. RIGHT-SIDE MODULE 3: BOTTOM FABRY-PÉROT INTERFERENCE ELEMENT
         ================================================================= */}
      <g
        className="cursor-pointer"
        onMouseEnter={() => onHover("interference")}
        onMouseLeave={() => onHover(null)}
        onClick={() => onBranchClick("interference")}
      >
        {/* Invisible interactive hit area for the bottom bay */}
        <rect x="1150" y="572" width="420" height="205" fill="transparent" />

        {/* Bay 3 Stacked Amber SMD Status LEDs (matching reference image) */}
        <rect
          x="1158"
          y="561"
          width="9"
          height="4.5"
          rx="1.5"
          fill="#ffbe2e"
          filter="url(#amberLedGlow)"
        />
        <rect
          x="1158"
          y="581"
          width="9"
          height="4.5"
          rx="1.5"
          fill="#ffbe2e"
          filter="url(#amberLedGlow)"
        />

        {/* Concentric Wavefront Interference Ripples (Left Reflected & Right Transmitted) */}
        <g fill="none" strokeLinecap="round">
          {interferenceArcs.map((arc) => {
            const activeBoost = hoveredBranch === "interference" ? 1.55 : 1.0;
            return (
              <g key={arc.index}>
                <path
                  d={arc.leftPath}
                  stroke={beamTheme.glow}
                  strokeWidth={hoveredBranch === "interference" ? "4.2" : "3.2"}
                  strokeOpacity={Math.min(0.95, arc.baseOpacity * activeBoost)}
                />
                <path
                  d={arc.rightPath}
                  stroke={beamTheme.glow}
                  strokeWidth={hoveredBranch === "interference" ? "4.2" : "3.2"}
                  strokeOpacity={Math.min(0.95, arc.baseOpacity * activeBoost)}
                />
              </g>
            );
          })}
        </g>

        {/* 3D Isometric Parallel Fabry-Pérot Etalon Plates */}
        <g filter="url(#softDropShadow)">
          {/* Back Parallel Mirror Plate */}
          <polygon
            points="1354,606 1378,619 1378,735 1354,722"
            fill="url(#etalonPlateGrad)"
            stroke="#94a3b8"
            strokeWidth="1.2"
          />
          {/* Middle Cavity Resonance Glow Plate */}
          <polygon
            points="1344,609 1368,622 1368,738 1344,725"
            fill="url(#etalonPlateGrad)"
            stroke="#7dd3fc"
            strokeWidth="1.1"
          />
          {/* Front Parallel Input Mirror Plate */}
          <polygon
            points="1332,612 1356,625 1356,741 1332,728"
            fill="url(#etalonPlateGrad)"
            stroke="#bae6fd"
            strokeWidth="1.4"
          />
          {/* Glowing Standing-Wave Cavity Hotspot between the plates */}
          <ellipse
            cx="1346"
            cy="680"
            rx="8"
            ry={hoveredBranch === "interference" ? "34" : "24"}
            fill="#00f2ff"
            fillOpacity={hoveredBranch === "interference" ? "0.75" : "0.5"}
            filter="url(#cyanIntenseGlow)"
          />
          <circle
            cx="1344"
            cy="680"
            r="4.5"
            fill="#ffffff"
            filter="url(#cyanOuterGlow)"
          />
        </g>
      </g>


      {/* Bay labels (index and short name); hidden on small screens where they would render below 11 px. */}
      {BRANCH_KEYS.map((key) => {
        const visual = HERO_BRANCH_VISUALS[key];
        const active = hoveredBranch === key;
        const badgeY = BADGE_Y[key];
        return (
          <g
            key={`label-${key}`}
            className="hidden cursor-pointer xl:block"
            onMouseEnter={() => onHover(key)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onBranchClick(key)}
          >
            <rect
              x="1175"
              y={badgeY - 3}
              width="245"
              height="20"
              rx="4"
              fill={active ? "#082f49" : "#0b0f17"}
              fillOpacity={active ? "0.9" : "0.65"}
              stroke={active ? "#38bdf8" : "#1e293b"}
              strokeWidth="1"
            />
            <text
              x="1184"
              y={badgeY + 10}
              fill={active ? "#7dd3fc" : "#94a3b8"}
              className="font-mono text-[10px] font-semibold uppercase tracking-widest"
            >
              {visual.index} · {visual.shortName}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
