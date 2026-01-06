// src/domain/maybe-colors.ts

export const MAYBE_COLOR_KEYS = [1, 2, 3, 4] as const;
export type MaybeColorKey = (typeof MAYBE_COLOR_KEYS)[number];

export const MAYBE_COLOR_HEX: Record<MaybeColorKey, string> = {
  1: "#FF0000", // Top-left (red)
  2: "#0000FF", // Top-right (blue)
  3: "#008000", // Bottom-left (green)
  4: "#FFA500", // Bottom-right (orange)
} as const;
