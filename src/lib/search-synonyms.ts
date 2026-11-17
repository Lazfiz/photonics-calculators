/**
 * Synonym groups for the site search: a query word or phrase from a group also matches the others. Lower case, American
 * spelling (`normalizeSpelling` runs first). Client-safe, so it lives here rather than in the server-only registry.
 */
export const SYNONYMS: readonly (readonly string[])[] = [
  ["spot size", "beam waist", "focused spot", "focus", "focal spot", "waist"],
  ["beam radius", "beam waist", "spot size"],
  ["link budget", "power budget", "loss budget"],
  ["na", "numerical aperture"],
  ["od", "optical density"],
  ["ri", "refractive index", "index of refraction"],
  ["mfd", "mode field diameter", "mode field"],
  ["mpe", "maximum permissible exposure", "exposure limit"],
  ["nohd", "nominal ocular hazard distance", "hazard distance"],
  ["eye safe power", "safe exposure", "maximum permissible exposure", "accessible emission limit"],
  ["ael", "accessible emission limit"],
  ["goggles", "eyewear", "glasses", "laser eyewear", "safety glasses"],
  // The longer phrases keep "coating" part of the term: "anti-reflection coating" still reaches "ar coating".
  ["ar coating", "anti-reflection coating", "antireflection coating", "anti-reflective coating", "antireflective coating",
    "anti-reflection", "antireflection", "anti-reflective", "antireflective"],
  ["hr coating", "high reflector", "dielectric mirror", "bragg mirror", "mirror reflectivity", "mirror reflectance"],
  ["dbr", "bragg mirror", "distributed bragg reflector"],
  ["fbg", "fiber bragg grating"],
  ["otdr", "optical time domain reflectometer"],
  ["edfa", "erbium doped fiber amplifier", "fiber amplifier"],
  ["wdm", "wavelength division multiplexing", "dwdm"],
  ["snr", "signal to noise", "signal-to-noise"],
  ["nep", "noise equivalent power"],
  ["qe", "quantum efficiency"],
  ["tia", "transimpedance amplifier", "transimpedance"],
  ["apd", "avalanche photodiode"],
  ["pmt", "photomultiplier"],
  ["ccd", "cmos", "camera", "image sensor"],
  ["psf", "point spread function"],
  ["mtf", "modulation transfer function"],
  ["fwhm", "linewidth", "line width"],
  ["fsr", "free spectral range"],
  ["shg", "second harmonic", "frequency doubling"],
  ["opo", "optical parametric oscillator"],
  ["gvd", "group velocity dispersion"],
  // GDD is GVD times the length: the pages that give GVD answer it too.
  ["gdd", "group delay dispersion", "group velocity dispersion"],
  ["m2", "m²", "m squared", "beam quality", "beam quality factor"],
  ["bpp", "beam parameter product", "beam quality"],
  ["sellmeier", "dispersion formula", "refractive index", "index of refraction"],
  ["bk7", "n-bk7", "borosilicate"],
  ["fused silica", "silica", "quartz glass"],
  ["fso", "free space optical", "free-space optical"],
  ["lidar", "ladar", "laser rangefinder"],
  ["divergence", "beam spread", "beam divergence"],
  ["rayleigh range", "confocal parameter"],
  ["dof", "depth of field", "depth of focus"],
  ["resolution", "resolving power", "rayleigh criterion"],
  ["brewster", "brewster angle", "polarizing angle"],
  ["waveplate", "wave plate", "retarder", "retardation plate"],
  ["qwp", "quarter wave plate", "quarter waveplate", "quarter-wave plate"],
  ["hwp", "half wave plate", "half waveplate", "half-wave plate"],
  ["etalon", "fabry-perot", "fabry perot"],
  ["isolator", "faraday rotator", "faraday"],
  ["photon energy", "electronvolt", "electron volt", "wavenumber converter"],
  ["f number", "f-number", "f stop", "f-stop", "fnumber", "f ratio"],
  ["v number", "v-number", "v parameter", "normalized frequency"],
  ["cn2", "refractive index structure parameter", "structure parameter", "atmospheric turbulence"],
  ["pcf", "photonic crystal fiber", "holey fiber"],
  ["grin", "gradient index", "graded index"],
  ["nd filter", "neutral density filter", "neutral density"],
  ["lens equation", "thin lens equation", "lens formula", "thin lens"],
  ["eom", "electro-optic modulator", "pockels cell"],
  ["aom", "acousto-optic modulator"],
  ["opa", "optical parametric amplifier"],
  ["dop", "degree of polarization"],
  ["per", "polarization extinction ratio", "extinction ratio"],
  ["pmd", "polarization mode dispersion"],
  ["smf", "single mode fiber", "single mode"],
  ["fiber loss", "fiber attenuation"],
  ["nonlinearity", "nonlinear"],
  ["irradiance", "power density"],
  ["ev to nm", "nm to ev", "wavelength to energy", "energy to wavelength", "wavelength to frequency",
    "frequency to wavelength", "wavenumber converter"],
];

/**
 * English words that are not in the search index but sit an edit or two from a word that is: the typo correction must
 * leave them alone, or "tower" reads as "power", "lower" as "power", "wake" as "wave" and "fairy" as "airy". Built from
 * the common words of the dependencies' English documentation (lower-case words in at least 8 of node_modules' 1444
 * Markdown files), plus a short list of everyday words, keeping those the correction would otherwise have rewritten;
 * tests/search-golden.test.ts checks that each still matches nothing as typed (else it doesn't belong here).
 */
export const KNOWN_WORDS: ReadonlySet<string> = new Set(
  (
    "accessed actively adds adopting affected alone alternative amount analytics assigned assignment bake bale " +
    "bank barn bead bean been beginning being belt beta bike binding bindings bits blocked boat bold bone book " +
    "born bounding bower braces breaking built bump bundling calculated caller calm camp card cart case cases " +
    "cast caused chaining changed chip clicking clone closer colon come comes comma commas commonly compiled " +
    "compiler compiles compiling complete completed complies composed conditional configured conjunction " +
    "connection constraints constructing context contexts contributing contributors convention converted " +
    "converting cord corner correctly could crashing created creation currently dare dart dawn days dear deep " +
    "deer deferred defining dependencies dependency depending designed desk differently directory dish displayed " +
    "dock doing dome donation done dove draft dusk ease edit effectively efficiently emitting enforces equality " +
    "especially everyone examples exceeded exception excluding executed exist existence expiration explicitly " +
    "extension factory fair fairy fake fame farm faster fate fear feel fetching finishes fire firm fist fixes " +
    "fixing fixtures flag flaw float floating foam fold folder followed fond font fork fort found frequently frog " +
    "fuel fully functional game gear generating generator geometry getting glad globally glow glue goat gold gone " +
    "gown grip hair hall hate heal heart heel hero hide hike hill hoisting home hook hope hour hover identity " +
    "implications implicit included indicates infer inference inferred infinite info information initially inner " +
    "inspected inspection instance instances intended internally intersection interval isolated iteration jail " +
    "jump keen kill kiss lake land lead letter leverage leveraging lift lime literal literals loan locale " +
    "location loft lone look looking lord lots lower luck mail majority make male maps mark mask math matter meal " +
    "meant meat might migrating migration mill mind mint mist moon more mouse move mutating mutation nail name " +
    "named neck negative nesting nice none normally nose notation null omitting onto optionally original oven " +
    "padding page paid pain pale park partially party past patch pear peer pending perceived performant " +
    "permission pick pill pine pink pipe plain plot plug plum poet poll port portions positive positives possibly " +
    "pour pray preferred prevents probably produce produced produces production progressive promises properly " +
    "property provides quite raid rail reached react rear redirect referenced referral regenerate registered " +
    "registry regression rejected relatively releases reliable removing replaced reserved resource resources " +
    "responsive resulting retained returned returning reusable reviewing roam rock roof root rose ruin safely " +
    "sail sake sampled sand save seal searching seat securely seed seem sees selector semantic send sending " +
    "separating separator serves services severity shall shared sharp shell ship shoe shop shown simple simplest " +
    "simultaneously sink situation skip slash slight slot slots sock sold sole song sore specified specifies " +
    "sponsors stale starting status stay stream streaming stripping strongly such suit swim switcher tale tall " +
    "team tear tells temporary text them thing think though throughout tide title toll tooling tower town " +
    "trailing transformed translation traversal traverse traversing treating tree triggered tune turned twin " +
    "typed unmatched unneeded unstable updated upgrades user users vain variants vast vertex vest visiting " +
    "visually wage wake warn ways week were west whole wife wine wise wish worm wrap write writing yard year zoom"
  ).split(" "),
);
