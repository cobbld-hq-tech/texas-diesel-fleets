import type { CSSProperties } from "react";

/**
 * Convert a CSS declaration string ("color:red;padding:4px") into a React
 * style object. Lets us carry the design prototype's inline styles over
 * verbatim instead of hand-transcribing every property to camelCase.
 */
export function css(decls: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const part of decls.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const prop = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!prop) continue;
    // CSS custom properties keep their literal name; everything else camelCases.
    const key = prop.startsWith("--")
      ? prop
      : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = value;
  }
  return out as CSSProperties;
}
