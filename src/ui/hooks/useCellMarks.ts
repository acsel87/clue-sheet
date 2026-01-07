// src/ui/hooks/useCellMarks.ts

import { useState, useCallback } from "react";
import type { CardId, CellMark, MaybeColorKey } from "../../domain";
import {
  EMPTY_MARK,
  createMaybeMark,
  type NumberMarkerKey,
} from "../../domain/cell-marks";

type CellKey = `${CardId}-${number}`;

export function useCellMarks() {
  const [cellMarks, setCellMarks] = useState<Map<CellKey, CellMark>>(new Map());

  const getCellMark = useCallback(
    (cardId: CardId, playerId: number): CellMark => {
      const key: CellKey = `${cardId}-${playerId}`;
      return cellMarks.get(key) ?? EMPTY_MARK;
    },
    [cellMarks]
  );

  const setCellMark = useCallback(
    (cardId: CardId, playerId: number, mark: CellMark) => {
      const key: CellKey = `${cardId}-${playerId}`;
      setCellMarks((prev) => {
        const next = new Map(prev);
        if (mark.type === "empty") {
          next.delete(key);
        } else {
          next.set(key, mark);
        }
        return next;
      });
    },
    []
  );

  // Toggle a maybe color preset (vertical stripes - automation-aware)
  const toggleMaybePreset = useCallback(
    (cardId: CardId, playerId: number, preset: MaybeColorKey) => {
      const currentMark = getCellMark(cardId, playerId);

      let currentPresets: Set<MaybeColorKey>;
      let currentNumbers: Set<NumberMarkerKey>;

      if (currentMark.type === "maybe") {
        currentPresets = new Set(currentMark.presets);
        currentNumbers = new Set(currentMark.numbers);
      } else {
        currentPresets = new Set();
        currentNumbers = new Set();
      }

      // Toggle the preset
      if (currentPresets.has(preset)) {
        currentPresets.delete(preset);
      } else {
        currentPresets.add(preset);
      }

      const newMark = createMaybeMark(currentPresets, currentNumbers);
      setCellMark(cardId, playerId, newMark);
    },
    [getCellMark, setCellMark]
  );

  // Toggle a number marker (white text - manual-only)
  const toggleNumberMarker = useCallback(
    (cardId: CardId, playerId: number, num: NumberMarkerKey) => {
      const currentMark = getCellMark(cardId, playerId);

      let currentPresets: Set<MaybeColorKey>;
      let currentNumbers: Set<NumberMarkerKey>;

      if (currentMark.type === "maybe") {
        currentPresets = new Set(currentMark.presets);
        currentNumbers = new Set(currentMark.numbers);
      } else {
        currentPresets = new Set();
        currentNumbers = new Set();
      }

      // Toggle the number
      if (currentNumbers.has(num)) {
        currentNumbers.delete(num);
      } else {
        currentNumbers.add(num);
      }

      const newMark = createMaybeMark(currentPresets, currentNumbers);
      setCellMark(cardId, playerId, newMark);
    },
    [getCellMark, setCellMark]
  );

  const clearMark = useCallback(
    (cardId: CardId, playerId: number) => {
      setCellMark(cardId, playerId, EMPTY_MARK);
    },
    [setCellMark]
  );

  return {
    getCellMark,
    setCellMark,
    toggleMaybePreset,
    toggleNumberMarker,
    clearMark,
  };
}
