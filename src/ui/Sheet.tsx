// src/ui/Sheet.tsx

import { useState, useCallback } from "react";
import type { CardId, ThemeId, MaybeColorKey, NumberMarkerKey } from "../domain";
import { getCards } from "../domain";
import { ActionBar } from "./ActionBar";
import { MarkerBar, type ValidationFns } from "./MarkerBar";
import { SheetGrid } from "./SheetGrid";
import { InfoDialog, ConfirmDialog } from "./dialogs";
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

  const { getCellMark, setCellMark, toggleMaybePreset, toggleNumberMarker, clearMark } =
    useCellMarks();
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);

  // Dialog states
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [infoDialogMessage, setInfoDialogMessage] = useState("");
  const [showLockConfirmDialog, setShowLockConfirmDialog] = useState(false);

  const needsPublicLock = publicCount > 0;
  const isGridDisabled = needsPublicLock && !publicLocked;

  // Get selected card names for confirmation dialog
  const getSelectedCardNames = useCallback((): string[] => {
    const cards = getCards(themeId);
    return publicSelected
      .map((id) => cards.find((c) => c.id === id)?.name)
      .filter((name): name is string => name !== undefined);
  }, [themeId, publicSelected]);

  // Placeholder validation - replace with real logic later
  const createValidation = useCallback(
    (_cardId: CardId, _playerId: number): ValidationFns => ({
      canMarkHas: () => ({ allowed: true }),
      canMarkNot: () => ({ allowed: true }),
      canToggleMaybe: (_preset: MaybeColorKey) => ({ allowed: true }),
    }),
    []
  );

  // Lock button handler - validates before showing confirmation
  function handleLockClick() {
    if (publicSelected.length !== publicCount) {
      setInfoDialogMessage(
        `Please select exactly ${publicCount} public card${publicCount !== 1 ? "s" : ""}.\n\nCurrently selected: ${publicSelected.length}`
      );
      setShowInfoDialog(true);
      return;
    }
    setShowLockConfirmDialog(true);
  }

  // After user confirms locking
  function handleLockConfirmed() {
    // Mark all cells in public card rows as NOT
    publicSelected.forEach((cardId) => {
      for (let playerId = 1; playerId <= PLAYER_COL_COUNT; playerId++) {
        setCellMark(cardId, playerId, { type: "not" });
      }
    });

    // Call parent's lock handler
    onLockPublic();
    setShowLockConfirmDialog(false);
  }

  // Cell click handlers
  function handleCellClick(cardId: CardId, playerId: number) {
    // Don't allow cell selection if grid is disabled or row is locked
    if (isGridDisabled) return;
    if (publicLocked && publicSelected.includes(cardId)) return;

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

  function handleToggleNumber(num: NumberMarkerKey) {
    if (!selectedCell) return;
    toggleNumberMarker(selectedCell.cardId, selectedCell.playerId, num);
  }

  function handleClearMark() {
    if (!selectedCell) return;
    clearMark(selectedCell.cardId, selectedCell.playerId);
  }

  // Build confirmation message with card list
  const confirmMessage = `The following card${publicSelected.length !== 1 ? "s" : ""} will be locked as public:\n\n• ${getSelectedCardNames().join("\n• ")}\n\nAll cells in these rows will be marked as NOT.`;

  return (
    <div className={styles.sheetContainer}>
      <div className={styles.gridContainer}>

        {/* Grid */}
        <SheetGrid
          themeId={themeId}
          playerCount={PLAYER_COL_COUNT}
          publicCount={publicCount}
          publicLocked={publicLocked}
          publicSelected={publicSelected}
          selectedCell={selectedCell}
          getCellMark={getCellMark}
          isGridDisabled={isGridDisabled}
          onTogglePublicCard={onTogglePublicCard}
          onCellClick={handleCellClick}
        />
      </div>

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <ActionBar
          onUndo={onUndo}
          onSettings={onSettings}
          showLockButton={needsPublicLock && !publicLocked}
          onLock={handleLockClick}
        />

        {selectedCell && (
          <MarkerBar
            currentMark={getCellMark(selectedCell.cardId, selectedCell.playerId)}
            validation={createValidation(selectedCell.cardId, selectedCell.playerId)}
            onMarkHas={handleMarkHas}
            onMarkNot={handleMarkNot}
            onToggleMaybe={handleToggleMaybe}
            onToggleNumber={handleToggleNumber}
            onClear={handleClearMark}
            onClose={handleCloseMarkerBar}
          />
        )}
      </div>

      {/* Validation info dialog */}
      <InfoDialog
        isOpen={showInfoDialog}
        title="Cannot Lock"
        message={infoDialogMessage}
        onClose={() => setShowInfoDialog(false)}
      />

      {/* Lock confirmation dialog */}
      <ConfirmDialog
        isOpen={showLockConfirmDialog}
        title="Lock Public Cards?"
        message={confirmMessage}
        confirmLabel="Lock"
        onConfirm={handleLockConfirmed}
        onCancel={() => setShowLockConfirmDialog(false)}
      />
    </div>
  );
}