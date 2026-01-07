// src/domain/cell-marks.ts

import type { MaybeColorKey } from "./maybe-colors";

// Number markers are separate from maybe colors
export type NumberMarkerKey = 1 | 2 | 3 | 4;
export const NUMBER_MARKER_KEYS = [1, 2, 3, 4] as const;

export type CellMark =
  | { type: "empty" }
  | { type: "has" }
  | { type: "not" }
  | {
      type: "maybe";
      presets: ReadonlySet<MaybeColorKey>; // Colored stripes (automation-aware)
      numbers: ReadonlySet<NumberMarkerKey>; // White number text (manual-only)
    };

export const EMPTY_MARK: CellMark = { type: "empty" } as const;

// Helper to create a maybe mark with proper defaults
export function createMaybeMark(
  presets: ReadonlySet<MaybeColorKey> = new Set(),
  numbers: ReadonlySet<NumberMarkerKey> = new Set()
): CellMark {
  // If both are empty, return empty mark
  if (presets.size === 0 && numbers.size === 0) {
    return EMPTY_MARK;
  }
  return { type: "maybe", presets, numbers };
}
