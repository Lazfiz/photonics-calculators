import Link from "next/link";
import { categoryMetadata } from "../../components/category-index";
import LaserSafetyDisclaimer from "../../components/laser-safety-disclaimer";
import { getCalculator } from "../../registry";

export const metadata = categoryMetadata("laser-safety");

type CalcLink = { name: string; href: string; desc: string };

const limitTools: CalcLink[] = [
  { name: "Exposure Duration", href: "/laser-safety/exposure-duration", desc: "Longest safe exposure of a CW beam at any wavelength from 180 nm to 1 mm." },
  { name: "Infrared & Corneal Eye Limits", href: "/laser-safety/infrared-hazard", desc: "Every eye limit at a wavelength and exposure time: aperture, limit and max power." },
  { name: "Skin MPE", href: "/laser-safety/skin-mpe", desc: "Skin limit (180 nm – 1 mm) and how a beam compares with it." },
  { name: "Corneal vs Retinal", href: "/laser-safety/corneal-vs-retinal", desc: "Which part of the eye limits the exposure, across the spectrum." },
  { name: "Thermal vs Photochemical", href: "/laser-safety/thermal-vs-photochemical", desc: "The two retinal limits at 400–600 nm and when the blue-light one takes over." },
  { name: "Extended Source", href: "/laser-safety/extended-source", desc: "C_E, α_max and T₂ for a source larger than 1.5 mrad." },
  { name: "Retinal Hazard", href: "/laser-safety/retinal-hazard", desc: "Retinal image size, irradiance and the retinal limits for a beam." },
  { name: "Retinal Image Size", href: "/laser-safety/retinal-image-size", desc: "Apparent source of a beam: retinal image and α with the eye accommodating." },
  { name: "Aversion Response Time", href: "/laser-safety/aversion-response", desc: "Largest visible power within the 0.25 s blink / aversion limit." },
  { name: "Multiple Wavelength", href: "/laser-safety/multiple-wavelength", desc: "Several lines in one beam: which add (same tissue) and which count independently." },
  { name: "MPE", href: "/laser-safety/mpe", desc: "Every eye limit at a wavelength (180 nm – 1 mm) and exposure time (1 ns – 30 000 s)." },
];

const hazardTools: CalcLink[] = [
  { name: "NOHD", href: "/laser-safety/nohd", desc: "Nominal ocular hazard distance of a direct beam, linear or Gaussian spread." },
  { name: "Diffuse Reflection", href: "/laser-safety/diffuse-reflection", desc: "Viewing a laser spot on a matte surface: extended-source limit and hazard distance." },
  { name: "Diode Laser Safety", href: "/laser-safety/diode-laser-safety", desc: "NOHD and OD of an elliptical diode beam (slow and fast axis)." },
  { name: "Fiber Laser Safety", href: "/laser-safety/fiber-laser-safety", desc: "NOHD and OD of a bare single-mode or multimode fiber end." },
  { name: "Industrial Laser Safety", href: "/laser-safety/industrial-laser-safety", desc: "Direct-beam NOHD, diffuse reflection from the workpiece, eyewear OD." },
  { name: "Medical Laser Safety", href: "/laser-safety/medical-laser-safety", desc: "Focusing handpiece: NOHD beyond the focus, eyewear OD, spot fluence and thermal relaxation time." },
  { name: "Optical Density", href: "/laser-safety/optical-density", desc: "Eyewear OD for a CW beam, 180 nm – 1 mm." },
  { name: "OD Requirements", href: "/laser-safety/od-requirements", desc: "OD from an exposure limit you supply and its aperture." },
  { name: "Laser Interlock Timing", href: "/laser-safety/interlock-design", desc: "Does the interlock stop the beam before an eye can reach it? Approach time, limit time, longest stopping time." },
];

const pulseTools: CalcLink[] = [
  { name: "Pulsed Laser MPE", href: "/laser-safety/pulsed-mpe", desc: "Largest energy per pulse of a pulse train: single pulse, average power and C_P, and the rule that binds." },
  { name: "Scanned Beam MPE", href: "/laser-safety/scanning-mpe", desc: "A beam sweeping across the eye as a train of passes: max power, the gain over a still beam, scan failure." },
  { name: "Ultrafast Laser Safety", href: "/laser-safety/ultrafast-laser-safety", desc: "Femtosecond and picosecond lasers: sub-ns limits, the average-power rule of MHz trains, OD and NOHD." },
  { name: "LiDAR Laser Safety", href: "/laser-safety/lidar-safety", desc: "Stationary 905 or 1550 nm lidar beam: NOHD, exposure at a viewing distance, eyewear OD." },
  { name: "Eye-Safe Wavelength", href: "/laser-safety/eye-safe-wavelength", desc: "Energy per pulse across the spectrum, one pulse or a train: why 1.4–2.6 µm is called eye-safe." },
];

const classTools: CalcLink[] = [
  { name: "Laser Classification", href: "/laser-safety/classification", desc: "Class 1 to 4 of a CW laser from its power, wavelength and beam, naked eye and binoculars." },
  { name: "AEL Limits", href: "/laser-safety/ael-limits", desc: "Accessible emission limits of each class, for one emission or a CW laser." },
  { name: "MPE vs AEL", href: "/laser-safety/ansi-iec-comparison", desc: "Exposure limit against emission limit: where IEC and ICNIRP part, and what ANSI does differently." },
  { name: "Enclosure Class", href: "/laser-safety/enclosure-class", desc: "Class of a product enclosing a stronger laser, and the OD its opening needs for Class 1." },
  { name: "Green Laser Pointer", href: "/laser-safety/green-laser-pointer", desc: "Class, NOHD, and how far a pointer dazzles (ICAO glare and flash-blindness levels)." },
  { name: "Research Lab Safety", href: "/laser-safety/research-lab-safety", desc: "Class, NOHD, eyewear OD and diffuse reflection of a lab laser, against the room size." },
];

const broadbandTools: CalcLink[] = [
  { name: "Blue Light Hazard", href: "/laser-safety/blue-light-hazard", desc: "B(λ)-weighted irradiance, the longest exposure and the IEC 62471 risk group." },
  { name: "UV Hazard", href: "/laser-safety/uv-hazard", desc: "Actinic S(λ)-weighted UV exposure (180–400 nm) and the UVA eye limit." },
  { name: "UV Exposure", href: "/laser-safety/uv-exposure", desc: "Daily UV limit with the S(λ) weighting: how long a source can be viewed." },
];

const beamHelpers: CalcLink[] = [
  { name: "Beam Diameter Conversion", href: "/laser-safety/beam-diameter-conversion", desc: "Convert 1/e², 1/e, and FWHM beam widths." },
  { name: "Beam Expander", href: "/laser-safety/beam-expander", desc: "Basic beam expansion and irradiance scaling helper." },
  { name: "Peak Power", href: "/laser-safety/peak-power", desc: "Pulse energy / pulse duration / peak power math helper." },
  { name: "Power Density", href: "/laser-safety/power-density", desc: "Irradiance math helper from power and beam size." },
  { name: "Atmospheric Attenuation", href: "/laser-safety/atmospheric-attenuation", desc: "Beer–Lambert style attenuation helper for outdoor concepts." },
  { name: "Thermal Lens Hazard", href: "/laser-safety/thermal-lens-hazard", desc: "Heating of an eyewear filter or lens by the beam it absorbs, and how long it lasts." },
];

function Section({
  title,
  subtitle,
  tone,
  items,
}: {
  title: string;
  subtitle: string;
  tone: "green" | "cyan" | "blue" | "fuchsia";
  items: CalcLink[];
}) {
  const toneClasses = {
    green: "border-green-500/30 bg-green-950/15 text-green-100",
    cyan: "border-cyan-500/30 bg-cyan-950/15 text-cyan-100",
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
            {getCalculator(calc.href).knownIssue && (
              <p className="mt-2 inline-block rounded-full border border-red-500/70 bg-red-950/50 px-2.5 py-0.5 text-xs font-medium text-red-200">
                Known error, under repair
              </p>
            )}
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
        Eye and skin exposure limits from one tested implementation of ICNIRP 2013 (180 nm to 1 mm), the repetitive-pulse
        and scanned-beam rules on it, and the IEC 60825-1:2014 laser classes. Every page states its model tier and
        references. Educational: not a substitute for a laser safety officer or the standards.
      </p>
      <LaserSafetyDisclaimer />

      <Section
        title="Eye and skin limits (ICNIRP 2013)"
        subtitle="Single exposures of 1 ns to 30 000 s on the tested ICNIRP 2013 tables: which limit applies, for how long, and to which part of the eye."
        tone="cyan"
        items={limitTools}
      />

      <Section
        title="Hazard distances, eyewear and interlocks"
        subtitle="How far a beam stays hazardous, the optical density that brings it within the limits, and whether a guard's interlock acts in time."
        tone="cyan"
        items={hazardTools}
      />

      <Section
        title="Pulsed and scanned beams (ICNIRP 2013)"
        subtitle="The repetitive-pulse rules (single pulse, every pulse group, C_P) on the same limits, with the sub-nanosecond rows; a scanned beam is a train of passes over the pupil."
        tone="cyan"
        items={pulseTools}
      />

      <Section
        title="Laser classes (IEC 60825-1:2014)"
        subtitle="Accessible emission limits rebuilt from the same tested ICNIRP 2013 limits (IEC's own values in the UV), for CW lasers. Classifying a product needs the standard and measurements."
        tone="blue"
        items={classTools}
      />

      <Section
        title="UV and blue light (broadband sources)"
        subtitle="Spectrally weighted hazards of lamps and LEDs: ICNIRP's actinic S(λ) and blue-light B(λ) functions and the IEC 62471 risk groups."
        tone="green"
        items={broadbandTools}
      />

      <Section
        title="Beam helpers"
        subtitle="Unit conversions and beam arithmetic used by the pages above."
        tone="fuchsia"
        items={beamHelpers}
      />
    </div>
  );
}
