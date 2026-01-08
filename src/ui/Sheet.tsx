// src/ui/Sheet.tsx

import { useState, useCallback } from "react";
import type { CardId, ThemeId, BarColorKey, NumberMarkerKey } from "../domain";
import type { OtherPlayerId } from "../domain/card-ownership";
import { getCards, createMark } from "../domain";
import { ActionBar } from "./ActionBar";
import { MarkerBar, type ValidationFns } from "./MarkerBar";
import { PlayerSelectBar } from "./PlayerSelectBar";
import { SheetGrid } from "./SheetGrid";
import { InfoDialog, ConfirmDialog } from "./dialogs";
import { useCellMarks, useCardOwnership } from "./hooks";
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
    removeNumberFromColumn,
  } = useCellMarks();

  // Phase 4: Card ownership tracking
  const { getShownTo, toggleShownTo } = useCardOwnership();

  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);

  // Phase 4: Selected owned card for player selection
  const [selectedOwnedCard, setSelectedOwnedCard] = useState<CardId | null>(null);

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

  // Get card name for player select bar
  const getCardName = useCallback(
    (cardId: CardId): string => {
      const cards = getCards(themeId);
      return cards.find((c) => c.id === cardId)?.name ?? "Unknown";
    },
    [themeId]
  );

  /**
   * Validation factory for marker operations
   *
   * Phase 3: Implements number constraints
   * - Numbers can only be ADDED to empty or bars cells
   * - Numbers can always be REMOVED (but will clear from column)
   * - HAS/NOT/bars can always be applied (even on numbered cells)
   */
  const createValidation = useCallback(
    (cardId: CardId, playerId: number): ValidationFns => {
      const currentMark = getCellMark(cardId, playerId);

      return {
        // Constraint 3.3: HAS is always allowed (numbers are preserved)
        canMarkHas: () => ({ allowed: true }),

        // Constraint 3.3: NOT is always allowed (numbers are preserved)
        canMarkNot: () => ({ allowed: true }),

        // Constraint 3.1-3.2: Numbers only on empty/bars
        // Constraint 3.4: Removal is always allowed (clears from column)
        canToggleNumber: (num: NumberMarkerKey) => {
          const isAdding = !currentMark.numbers.has(num);

          if (isAdding) {
            // Can only add numbers to empty or bars cells
            if (currentMark.primary === "has" || currentMark.primary === "not") {
              return {
                allowed: false,
                reason:
                  "Maybe markers can only be added to empty or colored bar cells. Clear this cell first, or mark it with color bars.",
              };
            }
          }
          // Removing is always allowed (will clear from entire column)
          return { allowed: true };
        },

        // Bars are manual-only helpers - no constraints
        canToggleBar: () => ({ allowed: true }),
      };
    },
    [getCellMark]
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
    const updates: Array<{
      cardId: CardId;
      playerId: number;
      mark: ReturnType<typeof createMark>;
    }> = [];

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

    // Close player select bar if open
    setSelectedOwnedCard(null);
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

  /**
   * Toggle number marker with column-aware removal
   *
   * Phase 3 behavior:
   * - Adding: Only allowed on empty/bars cells (validation handles this)
   * - Removing: Removes the number from ALL cells in the player's column
   */
  function handleToggleNumber(num: NumberMarkerKey) {
    if (!selectedCell) return;

    const currentMark = getCellMark(selectedCell.cardId, selectedCell.playerId);
    const isRemoving = currentMark.numbers.has(num);

    if (isRemoving) {
      // Constraint 3.4: Remove from entire column
      removeNumberFromColumn(selectedCell.playerId, num);
    } else {
      // Add to this cell only (validation already passed)
      toggleNumber(selectedCell.cardId, selectedCell.playerId, num);
    }
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

  // Phase 4: Owned card click handler
  function handleOwnedCardClick(cardId: CardId) {
    // Close marker bar if open
    setSelectedCell(null);
    // Toggle owned card selection
    setSelectedOwnedCard((prev) => (prev === cardId ? null : cardId));
  }

  function handleToggleShownToPlayer(playerId: OtherPlayerId) {
    if (!selectedOwnedCard) return;
    toggleShownTo(selectedOwnedCard, playerId);
  }

  function handleClosePlayerSelectBar() {
    setSelectedOwnedCard(null);
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
          // Phase 4 props
          selectedOwnedCard={selectedOwnedCard}
          getShownTo={getShownTo}
          onOwnedCardClick={handleOwnedCardClick}
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

        {/* Phase 4: Player select bar (for owned cards) */}
        {selectedOwnedCard && (
          <PlayerSelectBar
            cardName={getCardName(selectedOwnedCard)}
            selectedPlayers={getShownTo(selectedOwnedCard)}
            onTogglePlayer={handleToggleShownToPlayer}
            onClose={handleClosePlayerSelectBar}
          />
        )}

        {/* Marker bar (for cell marking) */}
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