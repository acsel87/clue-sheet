// src/ui/hooks/useCellMarks.ts

import { useState, useCallback } from "react";
import type { CardId, CellMark, MaybeColorKey } from "../../domain";
import { EMPTY_MARK } from "../../domain";

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

  const toggleMaybePreset = useCallback(
    (cardId: CardId, playerId: number, preset: MaybeColorKey) => {
      const currentMark = getCellMark(cardId, playerId);

      let newPresets: Set<MaybeColorKey>;

      if (currentMark.type === "maybe") {
        newPresets = new Set(currentMark.presets);
        if (newPresets.has(preset)) {
          newPresets.delete(preset);
        } else {
          newPresets.add(preset);
        }
      } else {
        newPresets = new Set([preset]);
      }

      if (newPresets.size === 0) {
        setCellMark(cardId, playerId, EMPTY_MARK);
      } else {
        setCellMark(cardId, playerId, {
          type: "maybe",
          presets: newPresets,
        });
      }
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
    clearMark,
  };
}
