// src/domain/cell-marks.ts

/**
 * NUMBER MARKERS (1-4)
 *
 * Semantic role: AUTOMATION-AWARE "maybe" markers
 *
 * These are the primary deduction markers used to track which players
 * might have which cards. They interact with automation rules:
 * - Auto-elimination when a card is found
 * - Column-wide removal constraints
 * - Deduction logic integration
 *
 * Displayed as: White text overlay (can appear on ANY primary marker)
 */
export type NumberMarkerKey = 1 | 2 | 3 | 4;
export const NUMBER_MARKER_KEYS = [1, 2, 3, 4] as const;

/**
 * BAR COLOR MARKERS (1-4)
 *
 * Semantic role: MANUAL-ONLY visual helpers
 *
 * These are optional colored stripe markers for players who want
 * additional visual categorization. They do NOT interact with any
 * automation rules - purely for personal organization.
 *
 * Displayed as: Vertical colored stripes (only when primary is "bars")
 */
export type BarColorKey = 1 | 2 | 3 | 4;
export const BAR_COLOR_KEYS = [1, 2, 3, 4] as const;

/**
 * PRIMARY MARKER TYPES (mutually exclusive)
 *
 * - empty: No primary marker (cell may still have number overlays)
 * - has: Player definitely HAS this card (checkmark icon)
 * - not: Player definitely does NOT have this card (X icon)
 * - bars: Visual helper stripes (no game logic meaning)
 */
export type PrimaryMark = "empty" | "has" | "not" | "bars";

/**
 * CELL MARK STRUCTURE
 *
 * Combines a primary marker with optional overlays:
 * - primary: The main marker state (mutually exclusive)
 * - numbers: Automation-aware "maybe" indicators (can overlay ANY primary)
 * - barColors: Which colored stripes to show (only when primary is "bars")
 *
 * Examples:
 * - { primary: "empty", numbers: {1,2}, barColors: {} } → Just "12" text
 * - { primary: "has", numbers: {3}, barColors: {} } → Checkmark with "3" overlay
 * - { primary: "bars", numbers: {}, barColors: {1,3} } → Red and green stripes
 */
export type CellMark = Readonly<{
  primary: PrimaryMark;
  numbers: ReadonlySet<NumberMarkerKey>;
  barColors: ReadonlySet<BarColorKey>;
}>;

/** Default empty cell mark */
export const EMPTY_MARK: CellMark = {
  primary: "empty",
  numbers: new Set(),
  barColors: new Set(),
};

/** Check if a mark is effectively empty (no visual content) */
export function isEmptyMark(mark: CellMark): boolean {
  return mark.primary === "empty" && mark.numbers.size === 0;
}

/** Check if mark has any numbers (automation-aware markers) */
export function hasNumbers(mark: CellMark): boolean {
  return mark.numbers.size > 0;
}

/** Check if mark has any bar colors */
export function hasBarColors(mark: CellMark): boolean {
  return mark.barColors.size > 0;
}

/** Create a mark with sensible defaults */
export function createMark(
  primary: PrimaryMark,
  numbers: ReadonlySet<NumberMarkerKey> = new Set(),
  barColors: ReadonlySet<BarColorKey> = new Set()
): CellMark {
  // Normalize: if everything empty, return EMPTY_MARK constant
  if (primary === "empty" && numbers.size === 0) {
    return EMPTY_MARK;
  }
  // barColors only meaningful for "bars" primary
  const effectiveBarColors =
    primary === "bars" ? barColors : new Set<BarColorKey>();
  return { primary, numbers, barColors: effectiveBarColors };
}

/** Set primary marker, preserving numbers */
export function withPrimary(mark: CellMark, primary: PrimaryMark): CellMark {
  return createMark(primary, mark.numbers, mark.barColors);
}

/** Toggle a number marker (automation-aware) */
export function withToggledNumber(
  mark: CellMark,
  num: NumberMarkerKey
): CellMark {
  const newNumbers = new Set(mark.numbers);
  if (newNumbers.has(num)) {
    newNumbers.delete(num);
  } else {
    newNumbers.add(num);
  }
  return createMark(mark.primary, newNumbers, mark.barColors);
}

/** Toggle a bar color (manual-only helper) */
export function withToggledBarColor(
  mark: CellMark,
  color: BarColorKey
): CellMark {
  const newColors = new Set(mark.barColors);
  if (newColors.has(color)) {
    newColors.delete(color);
  } else {
    newColors.add(color);
  }

  // If no colors left, revert to empty primary
  if (newColors.size === 0) {
    return createMark("empty", mark.numbers);
  }
  return createMark("bars", mark.numbers, newColors);
}

/** Remove a specific number from a mark */
export function withoutNumber(mark: CellMark, num: NumberMarkerKey): CellMark {
  if (!mark.numbers.has(num)) return mark;
  const newNumbers = new Set(mark.numbers);
  newNumbers.delete(num);
  return createMark(mark.primary, newNumbers, mark.barColors);
}

/** Remove all numbers from a mark */
export function withoutAllNumbers(mark: CellMark): CellMark {
  if (mark.numbers.size === 0) return mark;
  return createMark(mark.primary, new Set(), mark.barColors);
}
