import type { Metadata } from "next";
import Link from "next/link";
import LaserSafetyDisclaimer from "../../components/laser-safety-disclaimer";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety",
  title: "Laser Safety Calculators",
  description:
    "Educational laser safety calculators with explicit trust boundaries. Separate bounded CW point-source pre-check tools from general educational references and quarantined standards-heavy topics.",
};

type CalcLink = { name: string; href: string; desc: string };

const boundedPrecheckTools: CalcLink[] = [
  { name: "MPE", href: "/laser-safety/mpe", desc: "Bounded CW point-source MPE pre-check (1 ms to 3×10^4 s within explicitly implemented table slices, 400–1050 nm)." },
  { name: "NOHD", href: "/laser-safety/nohd", desc: "Direct-beam NOHD pre-check derived from the same bounded MPE branch." },
  { name: "Optical Density", href: "/laser-safety/optical-density", desc: "Required OD pre-check derived from the same bounded MPE branch." },
  { name: "OD Requirements", href: "/laser-safety/od-requirements", desc: "Manual validated-MPE mode for attenuation / eyewear OD math only." },
  { name: "Safe Viewing Distance", href: "/laser-safety/viewing-distance", desc: "Viewing-distance pre-check using the same bounded CW point-source assumptions." },
];

const educationalReferences: CalcLink[] = [
  { name: "ANSI / IEC Comparison", href: "/laser-safety/ansi-iec-comparison", desc: "High-level comparison of the standards families." },
  { name: "Atmospheric Attenuation", href: "/laser-safety/atmospheric-attenuation", desc: "Beer–Lambert style attenuation helper for outdoor concepts." },
  { name: "Aversion Response Time", href: "/laser-safety/aversion-response", desc: "Educational look at the 0.25 s blink / aversion convention." },
  { name: "Beam Diameter Conversion", href: "/laser-safety/beam-diameter-conversion", desc: "Convert 1/e², 1/e, and FWHM beam widths." },
  { name: "Beam Divergence Hazards", href: "/laser-safety/beam-divergence-hazards", desc: "Educational geometry around divergence and hazard distance." },
  { name: "Beam Expander", href: "/laser-safety/beam-expander", desc: "Basic beam expansion and irradiance scaling helper." },
  { name: "Corneal vs Retinal", href: "/laser-safety/corneal-vs-retinal", desc: "Concept page on where different wavelengths deposit damage." },
  { name: "Diode Laser Safety", href: "/laser-safety/diode-laser-safety", desc: "Educational notes on diode beam properties and safety implications." },
  { name: "Exposure Duration", href: "/laser-safety/exposure-duration", desc: "General educational reference about exposure duration as a safety variable." },
  { name: "Eye-Safe Wavelength", href: "/laser-safety/eye-safe-wavelength", desc: "Educational discussion of longer-wavelength ocular hazard differences." },
  { name: "Fiber Laser Safety", href: "/laser-safety/fiber-laser-safety", desc: "Educational context for fiber-laser-specific safety issues." },
  { name: "Green Laser Pointer", href: "/laser-safety/green-laser-pointer", desc: "Educational notes on pointer hazards and IR leakage concerns." },
  { name: "Industrial Laser Safety", href: "/laser-safety/industrial-laser-safety", desc: "General industrial laser safety context page." },
  { name: "Medical Laser Safety", href: "/laser-safety/medical-laser-safety", desc: "General medical-laser safety context page." },
  { name: "Peak Power", href: "/laser-safety/peak-power", desc: "Pulse energy / pulse duration / peak power math helper." },
  { name: "Power Density", href: "/laser-safety/power-density", desc: "Irradiance math helper from power and beam size." },
  { name: "Research Lab Safety", href: "/laser-safety/research-lab-safety", desc: "Educational lab-process and programmatic safety overview." },
  { name: "Retinal Image Size", href: "/laser-safety/retinal-image-size", desc: "Geometric helper for retinal spot / image-size concepts." },
  { name: "Thermal vs Photochemical", href: "/laser-safety/thermal-vs-photochemical", desc: "Educational comparison of damage mechanisms." },
  { name: "Ultrafast Laser Safety", href: "/laser-safety/ultrafast-laser-safety", desc: "Educational overview of ultrafast-specific safety concerns." },
];

const quarantinedTopics: CalcLink[] = [
  { name: "AEL Limits", href: "/laser-safety/ael-limits", desc: "Standards-heavy classification logic — quarantined." },
  { name: "Blue Light Hazard", href: "/laser-safety/blue-light-hazard", desc: "Photochemical / spectral-weighting topic — quarantined." },
  { name: "Corneal Limits", href: "/laser-safety/corneal-limits", desc: "Corneal limit logic is broader than the bounded suite supports." },
  { name: "Diffuse Reflection", href: "/laser-safety/diffuse-reflection", desc: "Extended-source / Lambertian hazard page — quarantined." },
  { name: "Enclosure Class", href: "/laser-safety/enclosure-class", desc: "Facility/process/policy-heavy topic — quarantined." },
  { name: "Extended Source", href: "/laser-safety/extended-source", desc: "Extended-source corrections are too easy to misuse in simplified form." },
  { name: "Infrared Corneal", href: "/laser-safety/infrared-corneal", desc: "IR corneal branch is standards-heavy and quarantined." },
  { name: "Infrared Hazard", href: "/laser-safety/infrared-hazard", desc: "Broad IR hazard page — quarantined." },
  { name: "Infrared Thermal", href: "/laser-safety/infrared-thermal", desc: "Thermal IR hazard topic — quarantined." },
  { name: "Maximum Exposure", href: "/laser-safety/maximum-exposure", desc: "Standards-heavy inversion of MPE logic — quarantined." },
  { name: "Multiple Wavelength", href: "/laser-safety/multiple-wavelength", desc: "Additive multi-wavelength hazard logic — quarantined." },
  { name: "PRF Correction", href: "/laser-safety/prf-correction", desc: "Pulse repetition correction logic — quarantined." },
  { name: "Retinal Hazard", href: "/laser-safety/retinal-hazard", desc: "Retinal hazard evaluation beyond bounded pre-check scope." },
  { name: "Scan Failure", href: "/laser-safety/scan-failure", desc: "Failure-mode scanning safety topic — quarantined." },
  { name: "Skin Hazard", href: "/laser-safety/skin-hazard", desc: "Skin hazard branch outside current bounded scope." },
  { name: "Skin MPE", href: "/laser-safety/skin-mpe", desc: "Skin MPE branch outside current bounded scope." },
  { name: "Thermal Lens Hazard", href: "/laser-safety/thermal-lens-hazard", desc: "Protective-filter / lens failure topic — quarantined." },
  { name: "UV / Blue Hazard", href: "/laser-safety/uv-blue-hazard", desc: "UV / blue hazard weighting topic — quarantined." },
  { name: "UV Exposure", href: "/laser-safety/uv-exposure", desc: "UV exposure limits topic — quarantined." },
  { name: "UV Hazard", href: "/laser-safety/uv-hazard", desc: "UV hazard evaluation — quarantined." },
];

function Section({
  title,
  subtitle,
  tone,
  items,
}: {
  title: string;
  subtitle: string;
  tone: "green" | "blue" | "fuchsia";
  items: CalcLink[];
}) {
  const toneClasses = {
    green: "border-green-500/30 bg-green-950/15 text-green-100",
    blue: "border-blue-500/30 bg-blue-950/15 text-blue-100",
    fuchsia: "border-fuchsia-500/30 bg-fuchsia-950/15 text-fuchsia-100",
  };

  return (
    <section className="mb-10">
      <div className={`mb-4 rounded-xl border p-4 ${toneClasses[tone]}`}>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 opacity-90">{subtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((calc) => (
          <Link
            key={calc.href}
            href={calc.href}
            className="rounded-lg border border-gray-800 bg-gray-900 p-5 transition hover:border-blue-500 hover:bg-gray-900/80"
          >
            <h3 className="text-lg font-semibold text-white">{calc.name}</h3>
            <p className="mt-1 text-sm text-gray-400">{calc.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function LaserSafetyPage() {
  return (
    <div className="min-h-screen max-w-5xl mx-auto bg-gray-950 text-white p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
        ← Back to Calculators
      </Link>
      <h1 className="text-3xl font-bold mb-2">Laser Safety</h1>
      <p className="text-gray-400 mb-4">
        Educational laser-safety content with explicit trust boundaries. The category is now split so bounded pre-check tools are clearly separated from general references and quarantined standards-heavy topics.
      </p>
      <LaserSafetyDisclaimer />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-xl border border-green-500/30 bg-green-950/15 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-300">Bounded pre-check</p>
          <p className="mt-2 text-sm text-green-100">5 pages in a shared CW point-source mini-suite with explicit assumptions and unsupported-regime rejection.</p>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/15 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Educational references</p>
          <p className="mt-2 text-sm text-blue-100">Concept pages and math helpers that are useful to keep public without pretending to be compliance-grade calculators.</p>
        </div>
        <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/15 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">Quarantined topics</p>
          <p className="mt-2 text-sm text-fuchsia-100">Standards-heavy, pulse-heavy, scanning-heavy, or policy-heavy pages that remain public for reference only and should not be used for sign-off.</p>
        </div>
      </div>

      <Section
        title="Bounded pre-check tools"
        subtitle="These are the only laser-safety pages currently being shaped toward semi-serious engineering pre-check use. Scope is narrow and explicit."
        tone="green"
        items={boundedPrecheckTools}
      />

      <Section
        title="Educational references"
        subtitle="Keep these public as educational/context pages and simple helpers. They are not formal compliance outputs."
        tone="blue"
        items={educationalReferences}
      />

      <Section
        title="Quarantined / standards-heavy topics"
        subtitle="These stay visible for reference and discussion, but their current implementations are too standards-dependent to trust operationally. The highest-risk topics are now hidden from landing-page navigation and only accessible by direct URL."
        tone="fuchsia"
        items={quarantinedTopics}
      />

      <div className="mb-10 rounded-xl border border-fuchsia-500/20 bg-fuchsia-950/10 p-4 text-sm leading-6 text-fuchsia-100">
        <p className="font-semibold text-fuchsia-200">Hidden from nav (still reachable by direct URL)</p>
        <p className="mt-2">classification, pulsed-mpe, scanned-mpe, scanning-mpe, lidar-safety, interlock-design, and multiple-pulse</p>
      </div>
    </div>
  );
}
