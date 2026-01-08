// src/domain/bar-colors.ts

import type { BarColorKey } from "./cell-marks";

/**
 * Hex colors for bar markers (vertical stripes)
 * Used as manual-only helper markers
 */
export const BAR_COLOR_HEX: Record<BarColorKey, string> = {
  1: "#FF0000", // red
  2: "#0000FF", // blue
  3: "#008000", // green
  4: "#FFA500", // orange
} as const;
