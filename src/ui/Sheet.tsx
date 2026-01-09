// src/ui/Sheet.tsx

import { useState, useCallback } from "react";
import type { CardId, ThemeId, BarColorKey, NumberMarkerKey } from "../domain";
import type { OtherPlayerId } from "../domain/card-ownership";
import type { SetupPhase } from "../infra/gameSetup";
import { getCards, createMark } from "../domain";
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

type Props = {
  themeId: ThemeId;
  publicCount: number;
  handSize: number;
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
    themeId,
    publicCount,
    handSize,
    setupPhase,
    publicCards,
    ownerCards,
    currentSelection,
    onToggleCardSelection,
    onConfirmPhase,
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

  const { getShownTo, toggleShownTo } = useCardOwnership();

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
   * Apply cell marks for confirmed cards
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
      // (cards that are not owner cards and not public cards)
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

  // Validation for marker operations
  const createValidation = useCallback(
    (cardId: CardId, playerId: number): ValidationFns => {
      const currentMark = getCellMark(cardId, playerId);

      return {
        canMarkHas: () => ({ allowed: true }),
        canMarkNot: () => ({ allowed: true }),
        canToggleNumber: (num: NumberMarkerKey) => {
          const isAdding = !currentMark.numbers.has(num);
          if (isAdding) {
            if (currentMark.primary === "has" || currentMark.primary === "not") {
              return {
                allowed: false,
                reason: "Maybe markers can only be added to empty or colored bar cells.",
              };
            }
          }
          return { allowed: true };
        },
        canToggleBar: () => ({ allowed: true }),
      };
    },
    [getCellMark]
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
   * 
   * This is the React 19 recommended pattern:
   * 1. Confirm phase transition (updates setupState)
   * 2. Apply cell marks (updates cellMarks)
   * Both happen synchronously in the same event, single render.
   */
  function handleConfirmed() {
    setShowConfirmDialog(false);

    // Confirm phase and get result
    const result = onConfirmPhase(setupPhase, currentSelection);

    // Apply marks in the SAME event handler (not useEffect)
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
    const currentMark = getCellMark(selectedCell.cardId, selectedCell.playerId);
    const isRemoving = currentMark.numbers.has(num);
    if (isRemoving) {
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