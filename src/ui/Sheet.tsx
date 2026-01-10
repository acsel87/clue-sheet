// src/ui/Sheet.tsx

import { useState, useCallback, useImperativeHandle, type Ref } from "react";
import type {
  CardId,
  BarColorKey,
  NumberMarkerKey,
  AppConfig,
  ConstraintId,
} from "../domain";
import type { OtherPlayerId } from "../domain/card-ownership";
import type { SetupPhase } from "../infra/gameSetup";
import { getCards, createMark, isConstraintRequired, withPrimary } from "../domain";
import { getPhaseInfo, validateSelection } from "../infra/gameSetup";
import { ActionBar } from "./ActionBar";
import { MarkerBar, type ValidationFns } from "./MarkerBar";
import { PlayerSelectBar } from "./PlayerSelectBar";
import { SheetGrid } from "./SheetGrid";
import { InfoDialog, ConfirmDialog } from "./dialogs";
import { useCellMarks, useCardOwnership } from "./hooks";
import styles from "./Sheet.module.css";

const PLAYER_COL_COUNT = 6;

type SelectedCell = { cardId: CardId; playerId: number } | null;

/** Handle exposed to parent for reset operations */
export type SheetHandle = {
  resetAllMarks: () => void;
  resetShownTo: () => void;
};

type Props = {
  ref?: Ref<SheetHandle>;
  config: AppConfig;
  handSize: number;
  publicCount: number;
  setupPhase: SetupPhase;
  publicCards: ReadonlyArray<CardId>;
  ownerCards: ReadonlyArray<CardId>;
  currentSelection: ReadonlyArray<CardId>;
  onToggleCardSelection: (cardId: CardId) => void;
  onConfirmPhase: (
    phase: SetupPhase,
    selectedCards: ReadonlyArray<CardId>
  ) => {
    nextPhase: SetupPhase;
    confirmedCards: ReadonlyArray<CardId>;
    cardType: "public" | "owner";
  } | null;
  onUndo: () => void;
  onSettings: () => void;
};

export function Sheet(props: Props) {
  const {
    ref,
    config,
    handSize,
    publicCount,
    setupPhase,
    publicCards,
    ownerCards,
    currentSelection,
    onToggleCardSelection,
    onConfirmPhase,
    onUndo,
    onSettings,
  } = props;

  const { themeId, autoRules } = config;

  const {
    getCellMark,
    setPrimary,
    toggleNumber,
    toggleBarColor,
    clearMark,
    batchSetMarks,
    removeNumberFromColumn,
    findNumberInColumn,
    resetAll: resetAllMarks,
  } = useCellMarks();

  const { getShownTo, toggleShownTo, resetAll: resetShownTo } = useCardOwnership();

  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [selectedOwnedCard, setSelectedOwnedCard] = useState<CardId | null>(null);

  // Dialog states
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Phase info
  const phaseInfo = getPhaseInfo(setupPhase, publicCount, handSize);
  const isInSetup = setupPhase !== "playing";
  const isGridDisabled = isInSetup;

  // Expose reset methods to parent via ref (React 19 style)
  useImperativeHandle(
    ref,
    () => ({
      resetAllMarks,
      resetShownTo,
    }),
    [resetAllMarks, resetShownTo]
  );

  // Get card names for dialogs
  const getCardNames = useCallback(
    (cardIds: ReadonlyArray<CardId>): string[] => {
      const cards = getCards(themeId);
      return cardIds
        .map((id) => cards.find((c) => c.id === id)?.name)
        .filter((name): name is string => name !== undefined);
    },
    [themeId]
  );

  /**
   * Check if a constraint is currently enforced
   */
  const isConstraintEnforced = useCallback(
    (constraintId: ConstraintId): boolean => {
      return isConstraintRequired(constraintId, autoRules);
    },
    [autoRules]
  );

  /**
   * Apply cell marks for confirmed cards (ALWAYS enabled - not toggleable)
   *
   * - Public cards: all cells in row → NOT
   * - Owner cards: P1 column → HAS for owned, NOT for others; other columns → NOT for owned cards
   */
  const applyMarksForCards = useCallback(
    (cards: ReadonlyArray<CardId>, type: "public" | "owner") => {
      const updates: Array<{
        cardId: CardId;
        playerId: number;
        mark: ReturnType<typeof createMark>;
      }> = [];

      const allCards = getCards(themeId);
      const cardSet = new Set(cards);
      const publicSet = new Set(publicCards);

      cards.forEach((cardId) => {
        for (let playerId = 1; playerId <= PLAYER_COL_COUNT; playerId++) {
          if (type === "public") {
            // Public cards: all cells → NOT
            updates.push({
              cardId,
              playerId,
              mark: createMark("not"),
            });
          } else {
            // Owner cards: P1 → HAS, others → NOT
            updates.push({
              cardId,
              playerId,
              mark: createMark(playerId === 1 ? "has" : "not"),
            });
          }
        }
      });

      // For owner cards: also mark rest of P1 column as NOT
      if (type === "owner") {
        allCards.forEach((card) => {
          if (!cardSet.has(card.id) && !publicSet.has(card.id)) {
            updates.push({
              cardId: card.id,
              playerId: 1,
              mark: createMark("not"),
            });
          }
        });
      }

      if (updates.length > 0) {
        batchSetMarks(updates);
      }
    },
    [batchSetMarks, themeId, publicCards]
  );

  /**
   * Apply rowElimination rule: mark all other cells in row as NOT
   * Preserves existing number markers and bar colors
   */
  const applyRowElimination = useCallback(
    (cardId: CardId, hasPlayerId: number) => {
      const updates: Array<{
        cardId: CardId;
        playerId: number;
        mark: ReturnType<typeof createMark>;
      }> = [];

      for (let playerId = 1; playerId <= PLAYER_COL_COUNT; playerId++) {
        // Skip the cell that was just marked as HAS
        if (playerId === hasPlayerId) continue;

        const currentMark = getCellMark(cardId, playerId);

        // Skip if already NOT or HAS (don't overwrite existing definitive marks)
        if (currentMark.primary === "not" || currentMark.primary === "has") {
          continue;
        }

        // Mark as NOT, preserving numbers and bar colors
        updates.push({
          cardId,
          playerId,
          mark: withPrimary(currentMark, "not"),
        });
      }

      if (updates.length > 0) {
        batchSetMarks(updates);
      }
    },
    [getCellMark, batchSetMarks]
  );

  /**
   * Apply lastMaybeDeduction rule: when a cell with numbers is marked NOT,
   * check if only one cell remains for each number in that column.
   * If so, mark that cell as HAS.
   *
   * @param cardId - The card that was just marked NOT
   * @param playerId - The player column
   */
  const applyLastMaybeDeduction = useCallback(
    (cardId: CardId, playerId: number) => {
      // Get the mark (numbers are preserved even after marking NOT)
      const mark = getCellMark(cardId, playerId);

      // Only proceed if this cell has number markers
      if (mark.numbers.size === 0) return;

      // Process each number marker
      for (const num of mark.numbers) {
        // Find all cells in this column with this number
        const cellsWithNumber = findNumberInColumn(playerId, num);

        // Check if any cell already has HAS (deduction already made or invalid)
        let hasHasCell = false;
        for (const cid of cellsWithNumber) {
          const m = getCellMark(cid, playerId);
          if (m.primary === "has") {
            hasHasCell = true;
            break;
          }
        }
        if (hasHasCell) continue; // Skip this number, can't make deduction

        // Find cells that are NOT marked as NOT (potential candidates)
        const candidateCells: CardId[] = [];
        for (const cid of cellsWithNumber) {
          const m = getCellMark(cid, playerId);
          if (m.primary !== "not") {
            candidateCells.push(cid);
          }
        }

        // If exactly one cell is not NOT, mark it as HAS
        if (candidateCells.length === 1) {
          const targetCardId = candidateCells[0]!;
          const targetMark = getCellMark(targetCardId, playerId);

          // Mark as HAS, preserving numbers and bar colors
          batchSetMarks([
            {
              cardId: targetCardId,
              playerId,
              mark: withPrimary(targetMark, "has"),
            },
          ]);

          // If rowElimination is enabled, also apply it to the newly marked HAS
          if (autoRules.rowElimination) {
            applyRowElimination(targetCardId, playerId);
          }
        }
        // If 0 candidates: all are NOT, no deduction possible
        // If >1 candidates: can't determine which one, no deduction yet
      }
    },
    [getCellMark, findNumberInColumn, batchSetMarks, autoRules.rowElimination, applyRowElimination]
  );

  /**
   * Validation for marker operations
   * Constraints are only enforced if dependent rules are enabled
   */
  const createValidation = useCallback(
    (cardId: CardId, playerId: number): ValidationFns => {
      const currentMark = getCellMark(cardId, playerId);

      return {
        canMarkHas: () => ({ allowed: true }),
        canMarkNot: () => ({ allowed: true }),
        canToggleNumber: (num: NumberMarkerKey) => {
          const isAdding = !currentMark.numbers.has(num);

          // Only enforce constraint if a rule depends on it
          if (isAdding && isConstraintEnforced("numbersOnlyOnEmptyOrBars")) {
            if (currentMark.primary === "has" || currentMark.primary === "not") {
              return {
                allowed: false,
                reason:
                  "Maybe markers can only be added to empty or colored bar cells.",
              };
            }
          }
          return { allowed: true };
        },
        canToggleBar: () => ({ allowed: true }),
      };
    },
    [getCellMark, isConstraintEnforced]
  );

  // Handle confirm button click
  function handleConfirmClick() {
    if (!phaseInfo) return;

    const validation = validateSelection(
      currentSelection.length,
      phaseInfo.requiredCount
    );

    if (!validation.valid) {
      setValidationMessage(validation.message ?? "Invalid selection");
      setShowValidationDialog(true);
      return;
    }

    setShowConfirmDialog(true);
  }

  /**
   * Handle confirmation - ALL state updates in ONE event handler
   */
  function handleConfirmed() {
    setShowConfirmDialog(false);

    // Confirm phase and get result
    const result = onConfirmPhase(setupPhase, currentSelection);

    // Apply marks in the SAME event handler
    if (result) {
      applyMarksForCards(result.confirmedCards, result.cardType);
    }
  }

  // Cell click handlers (only during playing phase)
  function handleCellClick(cardId: CardId, playerId: number) {
    if (isGridDisabled) return;

    const isPublicCard = publicCards.includes(cardId);
    const isOwnerCard = ownerCards.includes(cardId);
    if (isPublicCard || isOwnerCard) return;

    setSelectedOwnedCard(null);
    setSelectedCell({ cardId, playerId });
  }

  function handleCloseMarkerBar() {
    setSelectedCell(null);
  }

  /**
   * Mark cell as HAS
   * If rowElimination rule is enabled, also mark other cells in row as NOT
   */
  function handleMarkHas() {
    if (!selectedCell) return;

    const { cardId, playerId } = selectedCell;

    // Set the primary mark
    setPrimary(cardId, playerId, "has");

    // Apply rowElimination if enabled
    if (autoRules.rowElimination) {
      applyRowElimination(cardId, playerId);
    }

    handleCloseMarkerBar();
  }

  /**
   * Mark cell as NOT
   * If lastMaybeDeduction rule is enabled, check for deduction opportunities
   */
  function handleMarkNot() {
    if (!selectedCell) return;

    const { cardId, playerId } = selectedCell;

    // Set the primary mark
    setPrimary(cardId, playerId, "not");

    // Apply lastMaybeDeduction if enabled
    if (autoRules.lastMaybeDeduction) {
      applyLastMaybeDeduction(cardId, playerId);
    }

    handleCloseMarkerBar();
  }

  function handleToggleNumber(num: NumberMarkerKey) {
    if (!selectedCell) return;
    const currentMark = getCellMark(selectedCell.cardId, selectedCell.playerId);
    const isRemoving = currentMark.numbers.has(num);

    // Only remove from column if constraint is enforced
    if (isRemoving && isConstraintEnforced("numberToggleRemovesFromColumn")) {
      removeNumberFromColumn(selectedCell.playerId, num);
    } else {
      toggleNumber(selectedCell.cardId, selectedCell.playerId, num);
    }
  }

  function handleToggleBar(color: BarColorKey) {
    if (!selectedCell) return;
    toggleBarColor(selectedCell.cardId, selectedCell.playerId, color);
  }

  function handleClearMark() {
    if (!selectedCell) return;
    clearMark(selectedCell.cardId, selectedCell.playerId);
  }

  // Owner card click (for shown-to tracking)
  function handleOwnedCardClick(cardId: CardId) {
    if (isInSetup) return;
    if (!ownerCards.includes(cardId)) return;

    setSelectedCell(null);
    setSelectedOwnedCard((prev) => (prev === cardId ? null : cardId));
  }

  function handleToggleShownToPlayer(playerId: OtherPlayerId) {
    if (!selectedOwnedCard) return;
    toggleShownTo(selectedOwnedCard, playerId);
  }

  // Build confirmation message
  const confirmMessage = phaseInfo
    ? `${phaseInfo.title}:\n\n• ${getCardNames(currentSelection).join("\n• ")}`
    : "";

  return (
    <div className={styles.sheetContainer}>
      {/* Setup instruction banner */}
      {isInSetup && phaseInfo && (
        <div className={styles.setupBanner}>
          <span className={styles.setupTitle}>{phaseInfo.title}</span>
          <span className={styles.setupInstruction}>{phaseInfo.instruction}</span>
          <span className={styles.setupCount}>
            {currentSelection.length} / {phaseInfo.requiredCount} selected
          </span>
        </div>
      )}

      {/* Content area: grid + sidebar */}
      <div className={styles.contentArea}>
        <div className={styles.gridContainer}>
          <SheetGrid
            themeId={themeId}
            playerCount={PLAYER_COL_COUNT}
            setupPhase={setupPhase}
            publicCards={publicCards}
            ownerCards={ownerCards}
            currentSelection={currentSelection}
            selectedCell={selectedCell}
            getCellMark={getCellMark}
            isGridDisabled={isGridDisabled}
            onToggleCardSelection={onToggleCardSelection}
            onCellClick={handleCellClick}
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
            showConfirmButton={isInSetup}
            onConfirm={handleConfirmClick}
          />

          {selectedOwnedCard && (
            <PlayerSelectBar
              cardName={getCardNames([selectedOwnedCard])[0] ?? "Unknown"}
              selectedPlayers={getShownTo(selectedOwnedCard)}
              onTogglePlayer={handleToggleShownToPlayer}
              onClose={() => setSelectedOwnedCard(null)}
            />
          )}

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
      </div>

      {/* Validation error dialog */}
      <InfoDialog
        isOpen={showValidationDialog}
        title="Selection Required"
        message={validationMessage}
        onClose={() => setShowValidationDialog(false)}
      />

      {/* Confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={phaseInfo?.confirmLabel ?? "Confirm"}
        message={confirmMessage}
        confirmLabel="Confirm"
        onConfirm={handleConfirmed}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}