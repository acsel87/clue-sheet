// src/ui/hooks/useCellMarks.ts

import { useState, useCallback, useMemo } from "react";
import type { CardId } from "../../domain";
import {
  type CellMark,
  type PrimaryMark,
  type NumberMarkerKey,
  type BarColorKey,
  EMPTY_MARK,
  withPrimary,
  withToggledNumber,
  withToggledBarColor,
  withoutNumber,
  withoutAllNumbers,
  isEmptyMark,
} from "../../domain";

type CellKey = `${CardId}-${number}`;

function parseKey(key: CellKey): { cardId: CardId; playerId: number } {
  const [cardStr, playerStr] = key.split("-");
  return {
    cardId: Number(cardStr) as CardId,
    playerId: Number(playerStr),
  };
}

function makeKey(cardId: CardId, playerId: number): CellKey {
  return `${cardId}-${playerId}`;
}

/**
 * Hook for managing cell marks state
 *
 * Semantic distinction:
 * - Numbers: Automation-aware "maybe" markers - used for deduction tracking
 * - Bars: Manual-only visual helpers - no rule interactions
 */
export function useCellMarks() {
  const [cellMarks, setCellMarks] = useState<Map<CellKey, CellMark>>(new Map());

  // ============================================================
  // BASIC ACCESSORS
  // ============================================================

  const getCellMark = useCallback(
    (cardId: CardId, playerId: number): CellMark => {
      return cellMarks.get(makeKey(cardId, playerId)) ?? EMPTY_MARK;
    },
    [cellMarks]
  );

  const setCellMark = useCallback(
    (cardId: CardId, playerId: number, mark: CellMark) => {
      const key = makeKey(cardId, playerId);
      setCellMarks((prev) => {
        const next = new Map(prev);
        if (isEmptyMark(mark)) {
          next.delete(key);
        } else {
          next.set(key, mark);
        }
        return next;
      });
    },
    []
  );

  // ============================================================
  // ROW/COLUMN ACCESSORS (for rule processing)
  // ============================================================

  /** Get all marks in a row (by cardId) */
  const getRowMarks = useCallback(
    (cardId: CardId): Map<number, CellMark> => {
      const result = new Map<number, CellMark>();
      for (const [key, mark] of cellMarks) {
        const parsed = parseKey(key);
        if (parsed.cardId === cardId) {
          result.set(parsed.playerId, mark);
        }
      }
      return result;
    },
    [cellMarks]
  );

  /** Get all marks in a column (by playerId) */
  const getColumnMarks = useCallback(
    (playerId: number): Map<CardId, CellMark> => {
      const result = new Map<CardId, CellMark>();
      for (const [key, mark] of cellMarks) {
        const parsed = parseKey(key);
        if (parsed.playerId === playerId) {
          result.set(parsed.cardId, mark);
        }
      }
      return result;
    },
    [cellMarks]
  );

  /** Find all cardIds in a column that have a specific number */
  const findNumberInColumn = useCallback(
    (playerId: number, num: NumberMarkerKey): CardId[] => {
      const result: CardId[] = [];
      for (const [key, mark] of cellMarks) {
        const parsed = parseKey(key);
        if (parsed.playerId === playerId && mark.numbers.has(num)) {
          result.push(parsed.cardId);
        }
      }
      return result;
    },
    [cellMarks]
  );

  /** Check if any cell in a row has a specific primary mark */
  const rowHasPrimary = useCallback(
    (cardId: CardId, primary: PrimaryMark): boolean => {
      for (const [key, mark] of cellMarks) {
        const parsed = parseKey(key);
        if (parsed.cardId === cardId && mark.primary === primary) {
          return true;
        }
      }
      return false;
    },
    [cellMarks]
  );

  /** Check if any cell in a column has a specific primary mark */
  const columnHasPrimary = useCallback(
    (playerId: number, primary: PrimaryMark): boolean => {
      for (const [key, mark] of cellMarks) {
        const parsed = parseKey(key);
        if (parsed.playerId === playerId && mark.primary === primary) {
          return true;
        }
      }
      return false;
    },
    [cellMarks]
  );

  /** Count how many cells in a row have a specific primary mark */
  const countPrimaryInRow = useCallback(
    (cardId: CardId, primary: PrimaryMark): number => {
      let count = 0;
      for (const [key, mark] of cellMarks) {
        const parsed = parseKey(key);
        if (parsed.cardId === cardId && mark.primary === primary) {
          count++;
        }
      }
      return count;
    },
    [cellMarks]
  );

  /** Check if a specific number exists anywhere in a column */
  const columnHasNumber = useCallback(
    (playerId: number, num: NumberMarkerKey): boolean => {
      for (const [key, mark] of cellMarks) {
        const parsed = parseKey(key);
        if (parsed.playerId === playerId && mark.numbers.has(num)) {
          return true;
        }
      }
      return false;
    },
    [cellMarks]
  );

  // ============================================================
  // PRIMARY MARK MUTATIONS
  // ============================================================

  /** Set primary mark, preserving numbers */
  const setPrimary = useCallback(
    (cardId: CardId, playerId: number, primary: PrimaryMark) => {
      const current = getCellMark(cardId, playerId);
      const newMark = withPrimary(current, primary);
      setCellMark(cardId, playerId, newMark);
    },
    [getCellMark, setCellMark]
  );

  // ============================================================
  // NUMBER MARKER MUTATIONS (Automation-aware)
  // These will have constraints applied in Phase 3
  // ============================================================

  /** Toggle a number marker on a cell */
  const toggleNumber = useCallback(
    (cardId: CardId, playerId: number, num: NumberMarkerKey) => {
      const current = getCellMark(cardId, playerId);
      const newMark = withToggledNumber(current, num);
      setCellMark(cardId, playerId, newMark);
    },
    [getCellMark, setCellMark]
  );

  /** Remove a specific number from all cells in a column */
  const removeNumberFromColumn = useCallback(
    (playerId: number, num: NumberMarkerKey) => {
      setCellMarks((prev) => {
        const next = new Map(prev);
        for (const [key, mark] of prev) {
          const parsed = parseKey(key);
          if (parsed.playerId === playerId && mark.numbers.has(num)) {
            const newMark = withoutNumber(mark, num);
            if (isEmptyMark(newMark)) {
              next.delete(key);
            } else {
              next.set(key, newMark);
            }
          }
        }
        return next;
      });
    },
    []
  );

  /** Remove all numbers from a specific cell */
  const clearNumbersFromCell = useCallback(
    (cardId: CardId, playerId: number) => {
      const current = getCellMark(cardId, playerId);
      if (current.numbers.size === 0) return;
      const newMark = withoutAllNumbers(current);
      setCellMark(cardId, playerId, newMark);
    },
    [getCellMark, setCellMark]
  );

  // ============================================================
  // BAR COLOR MUTATIONS (Manual-only helpers)
  // No constraints - purely visual helpers
  // ============================================================

  /** Toggle a bar color on a cell (sets primary to "bars" if needed) */
  const toggleBarColor = useCallback(
    (cardId: CardId, playerId: number, color: BarColorKey) => {
      const current = getCellMark(cardId, playerId);
      const newMark = withToggledBarColor(current, color);
      setCellMark(cardId, playerId, newMark);
    },
    [getCellMark, setCellMark]
  );

  // ============================================================
  // BULK OPERATIONS
  // ============================================================

  /** Clear a cell completely */
  const clearMark = useCallback(
    (cardId: CardId, playerId: number) => {
      setCellMark(cardId, playerId, EMPTY_MARK);
    },
    [setCellMark]
  );

  /** Batch set marks for multiple cells */
  const batchSetMarks = useCallback(
    (updates: Array<{ cardId: CardId; playerId: number; mark: CellMark }>) => {
      setCellMarks((prev) => {
        const next = new Map(prev);
        for (const { cardId, playerId, mark } of updates) {
          const key = makeKey(cardId, playerId);
          if (isEmptyMark(mark)) {
            next.delete(key);
          } else {
            next.set(key, mark);
          }
        }
        return next;
      });
    },
    []
  );

  /** Reset all cell marks (for game reset) */
  const resetAll = useCallback(() => {
    setCellMarks(new Map());
  }, []);

  // ============================================================
  // DERIVED STATE (for display/debugging)
  // ============================================================

  /** All unique numbers currently in use */
  const allUsedNumbers = useMemo(() => {
    const numbers = new Set<NumberMarkerKey>();
    for (const mark of cellMarks.values()) {
      for (const num of mark.numbers) {
        numbers.add(num);
      }
    }
    return numbers;
  }, [cellMarks]);

  /** Total cells with marks (for debugging) */
  const totalMarkedCells = useMemo(() => cellMarks.size, [cellMarks]);

  return {
    // Basic accessors
    getCellMark,
    setCellMark,

    // Row/column accessors (for rule processing)
    getRowMarks,
    getColumnMarks,
    findNumberInColumn,
    rowHasPrimary,
    columnHasPrimary,
    countPrimaryInRow,
    columnHasNumber,

    // Primary mark mutations
    setPrimary,

    // Number mutations (automation-aware)
    toggleNumber,
    removeNumberFromColumn,
    clearNumbersFromCell,

    // Bar color mutations (manual-only)
    toggleBarColor,

    // Bulk operations
    clearMark,
    batchSetMarks,
    resetAll,

    // Derived state
    allUsedNumbers,
    totalMarkedCells,
  };
}
