// The useURLState keys and defaults of a calculator page, read from its page-client.tsx source, for
// tests/api-schemas.test.ts and scripts/check-schema.ts. A default can be a literal (`3`, `"kdp"`), a file-level
// `const NAME = "…"` or `= 1e6;`, or an imported constant or its member (`DNDT_PRESET`, `FUSED_SILICA_BRILLOUIN.n`,
// `PRESETS[0]`), which is read from the module the page imports it from. Anything else comes back undefined, so the comparison fails.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function pageDefaults(href: string): Promise<Map<string, number | string | undefined>> {
  const file = resolve(`src/app${href}/page-client.tsx`);
  const source = readFileSync(file, "utf8");
  const constant = (name: string) => {
    const m = source.match(new RegExp(`const ${name}(?::[^=]+)?\\s*=\\s*(?:"([^"]*)"|([-+.\\d][-+.\\deE]*)\\s*;)`));
    return m?.[1] ?? (m?.[2] === undefined ? undefined : Number(m[2]));
  };
  const imported = async (name: string, path: string[]) => {
    const from = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*"([^"]+)"/g)]
      .find((m) => m[1].split(",").some((s) => s.trim() === name))?.[2];
    if (!from?.startsWith(".")) return undefined;
    const mod = (await import(pathToFileURL(resolve(dirname(file), from)).href)) as Record<string, unknown>;
    let value: unknown = mod[name] ?? (mod.default as Record<string, unknown> | undefined)?.[name];
    for (const key of path) value = (value as Record<string, unknown> | undefined)?.[key];
    return typeof value === "number" || typeof value === "string" ? value : undefined;
  };
  const defaults = new Map<string, number | string | undefined>();
  for (const m of source.matchAll(
    /useURLState\(\s*"([^"]+)",\s*(?:"([^"]*)"|([-+.\d][-+.\deE]*)|([A-Za-z_]\w*)((?:\.\w+|\[\d+\])*))/g,
  )) {
    const [, key, str, num, name, members] = m;
    if (str !== undefined) defaults.set(key, str);
    else if (num !== undefined) defaults.set(key, Number(num));
    else if (!members) defaults.set(key, constant(name) ?? (await imported(name, [])));
    else defaults.set(key, await imported(name, [...members.matchAll(/\.(\w+)|\[(\d+)\]/g)].map((p) => p[1] ?? p[2])));
  }
  return defaults;
}
