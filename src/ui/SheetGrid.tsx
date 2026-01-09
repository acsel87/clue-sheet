// src/ui/SheetGrid.tsx

import { PLAYER_COLORS, BAR_COLOR_HEX } from "../domain";
import type {
  CardId,
  CategoryId,
  ThemeId,
  CellMark,
  NumberMarkerKey,
  AutoRulesConfig,
} from "../domain";
import type { OtherPlayerId } from "../domain/card-ownership";
import type { SetupPhase } from "../infra/gameSetup";
import { CATEGORIES, cardsByCategory } from "../domain/themes";
import { HasIcon, NotIcon } from "./icons";
import styles from "./Sheet.module.css";

type SelectedCell = { cardId: CardId; playerId: number } | null;

type Props = {
  themeId: ThemeId;
  playerCount: number;
  setupPhase: SetupPhase;
  publicCards: ReadonlyArray<CardId>;
  ownerCards: ReadonlyArray<CardId>;
  currentSelection: ReadonlyArray<CardId>;
  selectedCell: SelectedCell;
  getCellMark: (cardId: CardId, playerId: number) => CellMark;
  isGridDisabled: boolean;
  onToggleCardSelection: (cardId: CardId) => void;
  onCellClick: (cardId: CardId, playerId: number) => void;
  selectedOwnedCard: CardId | null;
  getShownTo: (cardId: CardId) => ReadonlySet<OtherPlayerId>;
  onOwnedCardClick: (cardId: CardId) => void;
  autoRules: AutoRulesConfig;
};

export function SheetGrid(props: Props) {
  const {
    themeId,
    playerCount,
    setupPhase,
    publicCards,
    ownerCards,
    currentSelection,
    selectedCell,
    getCellMark,
    isGridDisabled,
    onToggleCardSelection,
    onCellClick,
    selectedOwnedCard,
    getShownTo,
    onOwnedCardClick,
    autoRules,
  } = props;

  const cols = Array.from({ length: playerCount }, (_, i) => i + 1);
  const publicSet = new Set(publicCards);
  const ownerSet = new Set(ownerCards);
  const selectionSet = new Set(currentSelection);

  return (
    <div
      className={styles.grid}
      style={{ "--player-cols": playerCount } as React.CSSProperties}
      aria-label="Interactive score sheet grid"
    >
      {/* Header row */}
      <div className={`${styles.cell} ${styles.headerCell} ${styles.cornerCell}`}>
        Card
      </div>
      {cols.map((n) => (
        <div
          key={n}
          className={`${styles.cell} ${styles.headerCell}`}
          style={{ backgroundColor: PLAYER_COLORS[n - 1] }}
        >
          P{n}
        </div>
      ))}

      {/* Category rows */}
      {CATEGORIES.map((cat) => (
        <CategoryBlock
          key={cat.id}
          themeId={themeId}
          category={cat.id}
          color={cat.color}
          cols={cols}
          setupPhase={setupPhase}
          publicSet={publicSet}
          ownerSet={ownerSet}
          selectionSet={selectionSet}
          selectedCell={selectedCell}
          getCellMark={getCellMark}
          isGridDisabled={isGridDisabled}
          onToggleCardSelection={onToggleCardSelection}
          onCellClick={onCellClick}
          selectedOwnedCard={selectedOwnedCard}
          getShownTo={getShownTo}
          onOwnedCardClick={onOwnedCardClick}
          autoRules={autoRules}
        />
      ))}
    </div>
  );
}

// --- Sub-components ---

function CategoryBlock(props: {
  themeId: ThemeId;
  category: CategoryId;
  color: string;
  cols: number[];
  setupPhase: SetupPhase;
  publicSet: ReadonlySet<CardId>;
  ownerSet: ReadonlySet<CardId>;
  selectionSet: ReadonlySet<CardId>;
  selectedCell: SelectedCell;
  getCellMark: (cardId: CardId, playerId: number) => CellMark;
  isGridDisabled: boolean;
  onToggleCardSelection: (cardId: CardId) => void;
  onCellClick: (cardId: CardId, playerId: number) => void;
  selectedOwnedCard: CardId | null;
  getShownTo: (cardId: CardId) => ReadonlySet<OtherPlayerId>;
  onOwnedCardClick: (cardId: CardId) => void;
  autoRules: AutoRulesConfig;
}) {
  const {
    themeId,
    category,
    color,
    cols,
    setupPhase,
    publicSet,
    ownerSet,
    selectionSet,
    selectedCell,
    getCellMark,
    isGridDisabled,
    onToggleCardSelection,
    onCellClick,
    selectedOwnedCard,
    getShownTo,
    onOwnedCardClick,
    autoRules,
  } = props;

  const isInSetup = setupPhase !== "playing";

  return (
    <>
      {cardsByCategory(themeId, category).map((card) => {
        const isPublicCard = publicSet.has(card.id);
        const isOwnerCard = ownerSet.has(card.id);
        const isSelected = selectionSet.has(card.id);
        const isRowLocked = isPublicCard || isOwnerCard;

        // During setup, card names are clickable for selection
        // After setup, owner card names are clickable for shown-to tracking
        const canSelectDuringSetup = isInSetup && !isRowLocked;

        // Owner cards not in public set can be clicked for shown-to
        const canClickForShownTo = !isInSetup && isOwnerCard;

        // Murder item detection (only if rule is enabled)
        // All cells must be NOT, card must not be locked
        const isMurderItem =
          autoRules.murderDetection &&
          !isRowLocked &&
          cols.every((playerId) => {
            const mark = getCellMark(card.id, playerId);
            return mark.primary === "not";
          });

        // Shown-to state
        const shownTo = getShownTo(card.id);
        const hasShownToAny = shownTo.size > 0;
        const isSelectedForShownTo = selectedOwnedCard === card.id;

        // Card cell click handler
        const handleCardCellClick = () => {
          if (canSelectDuringSetup) {
            onToggleCardSelection(card.id);
          } else if (canClickForShownTo) {
            onOwnedCardClick(card.id);
          }
        };

        const isCardClickable = canSelectDuringSetup || canClickForShownTo;

        // Build card cell classes
        const cardCellClasses = [
          styles.cell,
          styles.cardCell,
          canSelectDuringSetup && styles.selectable,
          isSelected && styles.selected,
          isInSetup && !isRowLocked && styles.attention,
          isRowLocked && styles.cardLocked,
          isOwnerCard && !isInSetup && styles.cardOwned,
          isOwnerCard && hasShownToAny && styles.cardOwnedWithShownTo,
          isSelectedForShownTo && styles.cardSelectedForShownTo,
          isMurderItem && styles.cardMurderItem,
        ]
          .filter(Boolean)
          .join(" ");

        // Card cell style
        // Public cards: white background with black text
        // Owner cards: transparent (for shown-to gradient to work)
        // Normal cards: category background color
        const cardCellStyle: React.CSSProperties = {
          ...(isPublicCard
            ? { backgroundColor: "white", color: "black" }
            : isOwnerCard
              ? { ...(hasShownToAny ? getShownToStyle(shownTo) : {}) }
              : { backgroundColor: color }),
        };

        return (
          <div
            key={card.id}
            className={`${styles.row} ${isRowLocked ? styles.lockedRow : ""}`}
            style={{ gridColumn: `1 / span ${cols.length + 1}` }}
          >
            {/* Card name cell */}
            <button
              type="button"
              className={cardCellClasses}
              style={cardCellStyle}
              onClick={handleCardCellClick}
              disabled={!isCardClickable}
              aria-disabled={!isCardClickable}
              title={
                isPublicCard
                  ? "Public card"
                  : isOwnerCard
                    ? "Your card - click to track shown players"
                    : canSelectDuringSetup
                      ? "Click to select/deselect"
                      : isMurderItem
                        ? "Potential murder item"
                        : undefined
              }
            >
              <span className={styles.cardName}>{card.name}</span>
            </button>

            {/* Mark cells for each player */}
            {cols.map((playerId) => {
              // P1 column cells (non-public, non-owner) should also be locked after setup
              const isP1ColumnLocked =
                playerId === 1 &&
                setupPhase === "playing" &&
                !isPublicCard &&
                !isOwnerCard;

              const isCellDisabled = isGridDisabled || isRowLocked || isP1ColumnLocked;
              const isCellLocked = isRowLocked || isP1ColumnLocked;

              return (
                <MarkCell
                  key={playerId}
                  cardId={card.id}
                  playerId={playerId}
                  categoryColor={color}
                  mark={getCellMark(card.id, playerId)}
                  isSelected={
                    selectedCell?.cardId === card.id &&
                    selectedCell?.playerId === playerId
                  }
                  isDisabled={isCellDisabled}
                  isLocked={isCellLocked}
                  isPublicCard={isPublicCard}
                  onClick={() => !isCellDisabled && onCellClick(card.id, playerId)}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
}

function MarkCell(props: {
  cardId: CardId;
  playerId: number;
  categoryColor: string;
  mark: CellMark;
  isSelected: boolean;
  isDisabled: boolean;
  isLocked: boolean;
  isPublicCard: boolean;
  onClick: () => void;
}) {
  const {
    playerId,
    categoryColor,
    mark,
    isSelected,
    isDisabled,
    isLocked,
    isPublicCard,
    onClick,
  } = props;

  const barStripeStyle = getBarStripeStyle(mark);
  const hasBars = mark.primary === "bars" && mark.barColors.size > 0;

  // Background logic:
  // - P1 column OR bars: no background (undefined)
  // - Public card row (locked): white background
  // - Owner card row (locked but NOT public): no background (undefined)
  // - Normal cells: category color
  const cellBackgroundColor =
    hasBars || playerId === 1
      ? undefined
      : isLocked
        ? isPublicCard
          ? "white"
          : undefined
        : categoryColor;

  return (
    <button
      type="button"
      className={`${styles.cell} ${styles.markCell} 
        ${hasBars ? styles.barsCell : ""} 
        ${isSelected ? styles.cellSelected : ""} 
        ${isDisabled ? styles.cellDisabled : ""} 
        ${isLocked ? styles.cellLocked : ""}`}
      style={{
        backgroundColor: cellBackgroundColor,
        borderColor: playerId === 1 ? undefined : PLAYER_COLORS[playerId - 1],
        ...barStripeStyle,
      }}
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={`Cell for player ${playerId}`}
    >
      <CellContent mark={mark} />
    </button>
  );
}

function CellContent({ mark }: { mark: CellMark }) {
  const hasNums = mark.numbers.size > 0;

  return (
    <>
      {mark.primary === "has" && <HasIcon width={16} height={16} />}
      {mark.primary === "not" && <NotIcon width={16} height={16} />}
      {hasNums && <NumbersOverlay numbers={mark.numbers} />}
    </>
  );
}

function NumbersOverlay({ numbers }: { numbers: ReadonlySet<NumberMarkerKey> }) {
  const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);
  return <span className={styles.numbersOverlay}>{sortedNumbers.join("")}</span>;
}

function getBarStripeStyle(mark: CellMark): React.CSSProperties | undefined {
  if (mark.primary !== "bars" || mark.barColors.size === 0) return undefined;
  const colors = mark.barColors;
  return {
    "--bar-1": colors.has(1) ? BAR_COLOR_HEX[1] : "transparent",
    "--bar-2": colors.has(2) ? BAR_COLOR_HEX[2] : "transparent",
    "--bar-3": colors.has(3) ? BAR_COLOR_HEX[3] : "transparent",
    "--bar-4": colors.has(4) ? BAR_COLOR_HEX[4] : "transparent",
  } as React.CSSProperties;
}

function getShownToStyle(shownTo: ReadonlySet<OtherPlayerId>): React.CSSProperties {
  if (shownTo.size === 0) return {};
  return {
    "--shown-p2": shownTo.has(2) ? PLAYER_COLORS[1] : "transparent",
    "--shown-p3": shownTo.has(3) ? PLAYER_COLORS[2] : "transparent",
    "--shown-p4": shownTo.has(4) ? PLAYER_COLORS[3] : "transparent",
    "--shown-p5": shownTo.has(5) ? PLAYER_COLORS[4] : "transparent",
    "--shown-p6": shownTo.has(6) ? PLAYER_COLORS[5] : "transparent",
  } as React.CSSProperties;
}