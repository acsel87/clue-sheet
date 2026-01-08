// src/domain/cell-marks.ts

/**
 * Number markers - white text overlay
 * Can exist on ANY primary marker type
 * Will interact with automation rules (Phase 2+)
 */
export type NumberMarkerKey = 1 | 2 | 3 | 4;
export const NUMBER_MARKER_KEYS = [1, 2, 3, 4] as const;

/**
 * Bar colors - colored vertical stripes
 * Only used when primary is "bars"
 * Manual-only helper markers (no rule interactions)
 */
export type BarColorKey = 1 | 2 | 3 | 4;
export const BAR_COLOR_KEYS = [1, 2, 3, 4] as const;

/**
 * Primary marker types (mutually exclusive)
 * - empty: no primary marker
 * - has: player has this card (checkmark)
 * - not: player does not have this card (X)
 * - bars: colored stripes helper marker
 */
export type PrimaryMark = "empty" | "has" | "not" | "bars";

/**
 * Cell mark structure
 * - primary: main marker (mutually exclusive)
 * - numbers: white number text overlay (can exist on ANY primary)
 * - barColors: which colored stripes (only meaningful when primary is "bars")
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

/** Check if mark has any numbers */
export function hasNumbers(mark: CellMark): boolean {
  return mark.numbers.size > 0;
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

/** Create a mark preserving existing numbers */
export function withPrimary(mark: CellMark, primary: PrimaryMark): CellMark {
  return createMark(primary, mark.numbers, mark.barColors);
}

/** Create a mark with toggled number */
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

/** Create a mark with toggled bar color (only affects "bars" primary) */
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

  // If primary wasn't "bars", switch to it; if no colors left, switch to empty
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
