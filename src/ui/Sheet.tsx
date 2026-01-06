// src/ui/Sheet.tsx

import { useState, useCallback } from "react";
import type { CardId, ThemeId, MaybeColorKey } from "../domain";
import { ActionBar } from "./ActionBar";
import { MarkerBar, type ValidationFns } from "./MarkerBar";
import { SheetGrid } from "./SheetGrid";
import { useCellMarks } from "./hooks";
import styles from "./Sheet.module.css";

const PLAYER_COL_COUNT = 6;

type SelectedCell = { cardId: CardId; playerId: number } | null;

type Props = {
  themeId: ThemeId;
  publicCount: number;
  publicLocked: boolean;
  publicSelected: ReadonlyArray<CardId>;
  onTogglePublicCard: (cardId: CardId) => void;
  onLockPublic: () => void;
  onUndo: () => void;
  onSettings: () => void;
};

export function Sheet(props: Props) {
  const {
    themeId,
    publicCount,
    publicLocked,
    publicSelected,
    onTogglePublicCard,
    onLockPublic,
    onUndo,
    onSettings,
  } = props;

  const { getCellMark, setCellMark, toggleMaybePreset, clearMark } = useCellMarks();
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);

  const needsPublicLock = publicCount > 0;
  const isSelectionComplete = publicSelected.length === publicCount;

  // Placeholder validation - replace with real logic later
  const createValidation = useCallback(
    (_cardId: CardId, _playerId: number): ValidationFns => ({
      canMarkHas: () => ({ allowed: true }),
      canMarkNot: () => ({ allowed: true }),
      canToggleMaybe: (_preset: MaybeColorKey) => ({ allowed: true }),
    }),
    []
  );

  // Handlers
  function handleCellClick(cardId: CardId, playerId: number) {
    setSelectedCell({ cardId, playerId });
  }

  function handleCloseMarkerBar() {
    setSelectedCell(null);
  }

  function handleMarkHas() {
    if (!selectedCell) return;
    setCellMark(selectedCell.cardId, selectedCell.playerId, { type: "has" });
    handleCloseMarkerBar();
  }

  function handleMarkNot() {
    if (!selectedCell) return;
    setCellMark(selectedCell.cardId, selectedCell.playerId, { type: "not" });
    handleCloseMarkerBar();
  }

  function handleToggleMaybe(preset: MaybeColorKey) {
    if (!selectedCell) return;
    toggleMaybePreset(selectedCell.cardId, selectedCell.playerId, preset);
  }

  function handleClearMark() {
    if (!selectedCell) return;
    clearMark(selectedCell.cardId, selectedCell.playerId);
  }

  return (
    <div className={styles.sheetContainer}>
      <div className={styles.gridContainer}>
        {/* Public cards bar */}
        {needsPublicLock && (
          <div className={styles.publicBar}>
            <div className={styles.publicBarContent}>
              <span className={styles.publicBarTitle}>Public cards</span>
              <span className={styles.publicBarMeta}>
                {publicLocked ? "Locked" : "Unlocked"} • {publicSelected.length}/
                {publicCount} selected
              </span>
            </div>

            {!publicLocked ? (
              <button
                type="button"
                className="button primary"
                disabled={!isSelectionComplete}
                onClick={onLockPublic}
                title={
                  isSelectionComplete
                    ? "Lock public cards"
                    : "Select all public cards first"
                }
              >
                Lock
              </button>
            ) : (
              <span className={styles.publicLockedPill}>Locked</span>
            )}
          </div>
        )}

        {/* Grid */}
        <SheetGrid
          themeId={themeId}
          playerCount={PLAYER_COL_COUNT}
          publicCount={publicCount}
          publicLocked={publicLocked}
          publicSelected={publicSelected}
          selectedCell={selectedCell}
          getCellMark={getCellMark}
          onTogglePublicCard={onTogglePublicCard}
          onCellClick={handleCellClick}
        />
      </div>

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <ActionBar onUndo={onUndo} onSettings={onSettings} />

        {selectedCell && (
          <MarkerBar
            currentMark={getCellMark(selectedCell.cardId, selectedCell.playerId)}
            validation={createValidation(selectedCell.cardId, selectedCell.playerId)}
            onMarkHas={handleMarkHas}
            onMarkNot={handleMarkNot}
            onToggleMaybe={handleToggleMaybe}
            onClear={handleClearMark}
            onClose={handleCloseMarkerBar}
          />
        )}
      </div>
    </div>
  );
}