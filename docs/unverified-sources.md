# Unverified sources

Standards and other sources that we know a calculator cites but whose text has not yet been checked against what
the calculator uses. The list may not be complete. The physics may well be right; this list says which numbers rest on a reading we haven't confirmed.
Each entry leaves the list once the source has been checked, line by line, against the code and its tests.

| Source | Pages | What is unverified |
|---|---|---|
| Rec. ITU-R P.1814-1 (09/2025), §§ 4.1.2.2, 4.2.3 | [Rain attenuation](https://photonicscalculators.com/free-space-comms/rain-attenuation) | The rain coefficients k, α (Table 4) and the multiple-scattering coefficients p₀–p₂, k₀–k₂ (Table 5) for each gamma drop-size shape µ, as coded in `src/physics/free-space-comms/precipitation.ts`, have not been checked against the Recommendation. An independent empirical law agrees within 1 %: Carbonneau's 1.076·R^0.67 (tabulated by Kaushal & Kaddoum (2015), Table IV) gives 9.30 dB/km at 25 mm/h, against the µ = −1 row's 9.37. That makes the coded values plausible; it does not check their transcription. |
| EN 60825-1:2014/A11:2021 | [AEL limits](https://photonicscalculators.com/laser-safety/ael-limits), [Classification](https://photonicscalculators.com/laser-safety/classification) | The EU skin AEL at 1250–1400 nm follows K. Schulmeister's 2022 white paper on A11 (Seibersdorf Laboratories), not the amendment's text. |
| IEC 61753-1 | [Connector insertion loss](https://photonicscalculators.com/fiber-optics/connector-insertion-loss), [Connector return loss](https://photonicscalculators.com/fiber-optics/connector-return-loss) | The connection performance grades come from P. Kolesar's 2013 IEEE 802.3bm slides (slide 6), which summarise the standard (edition not identified; the slides call Grade A not yet defined), not from the standard itself. |

Found one of these checked, or another source that belongs here? Open a
[physics error issue](https://github.com/Lazfiz/photonics-calculators/issues/new?template=physics-error.yml).
