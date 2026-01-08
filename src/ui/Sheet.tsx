// src/ui/Sheet.tsx

import { useState, useCallback } from "react";
import type { CardId, ThemeId, BarColorKey, NumberMarkerKey } from "../domain";
import { getCards, createMark } from "../domain";
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

  const {
    getCellMark,
    setPrimary,
    toggleNumber,
    toggleBarColor,
    clearMark,
    batchSetMarks,
  } = useCellMarks();

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

  /**
   * Validation factory for marker operations
   * 
   * Phase 2: Placeholder validation (all allowed)
   * Phase 3: Will add real constraints for numbers
   * 
   * Semantic distinction:
   * - Numbers: automation-aware, will have constraints
   * - Bars: manual-only, typically always allowed
   */
  const createValidation = useCallback(
    (_cardId: CardId, _playerId: number): ValidationFns => ({
      canMarkHas: () => ({ allowed: true }),
      canMarkNot: () => ({ allowed: true }),
      // Numbers are automation-aware - constraints coming in Phase 3
      canToggleNumber: (_num: NumberMarkerKey) => ({ allowed: true }),
      // Bars are manual-only helpers - no constraints needed
      canToggleBar: (_color: BarColorKey) => ({ allowed: true }),
    }),
    []
  );

  // Lock button handler
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
    const updates: Array<{ cardId: CardId; playerId: number; mark: ReturnType<typeof createMark> }> = [];

    publicSelected.forEach((cardId) => {
      for (let playerId = 1; playerId <= PLAYER_COL_COUNT; playerId++) {
        const currentMark = getCellMark(cardId, playerId);
        // Preserve numbers, set primary to "not"
        updates.push({
          cardId,
          playerId,
          mark: createMark("not", currentMark.numbers),
        });
      }
    });

    batchSetMarks(updates);
    onLockPublic();
    setShowLockConfirmDialog(false);
  }

  // Cell click handlers
  function handleCellClick(cardId: CardId, playerId: number) {
    if (isGridDisabled) return;
    if (publicLocked && publicSelected.includes(cardId)) return;

    setSelectedCell({ cardId, playerId });
  }

  function handleCloseMarkerBar() {
    setSelectedCell(null);
  }

  function handleMarkHas() {
    if (!selectedCell) return;
    setPrimary(selectedCell.cardId, selectedCell.playerId, "has");
    handleCloseMarkerBar();
  }

  function handleMarkNot() {
    if (!selectedCell) return;
    setPrimary(selectedCell.cardId, selectedCell.playerId, "not");
    handleCloseMarkerBar();
  }

  function handleToggleNumber(num: NumberMarkerKey) {
    if (!selectedCell) return;
    toggleNumber(selectedCell.cardId, selectedCell.playerId, num);
    // Don't close - allow toggling multiple numbers
  }

  function handleToggleBar(color: BarColorKey) {
    if (!selectedCell) return;
    toggleBarColor(selectedCell.cardId, selectedCell.playerId, color);
    // Don't close - allow toggling multiple colors
  }

  function handleClearMark() {
    if (!selectedCell) return;
    clearMark(selectedCell.cardId, selectedCell.playerId);
  }

  const confirmMessage = `The following card${publicSelected.length !== 1 ? "s" : ""} will be locked as public:\n\n• ${getSelectedCardNames().join("\n• ")}\n\nAll cells in these rows will be marked as NOT.`;

  return (
    <div className={styles.sheetContainer}>
      <div className={styles.gridContainer}>
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
            onToggleNumber={handleToggleNumber}
            onToggleBar={handleToggleBar}
            onClear={handleClearMark}
            onClose={handleCloseMarkerBar}
          />
        )}
      </div>

      <InfoDialog
        isOpen={showInfoDialog}
        title="Cannot Lock"
        message={infoDialogMessage}
        onClose={() => setShowInfoDialog(false)}
      />

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