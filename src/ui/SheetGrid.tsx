// src/ui/SheetGrid.tsx

import { PLAYER_COLORS, BAR_COLOR_HEX } from "../domain";
import type { CardId, CategoryId, ThemeId, CellMark, NumberMarkerKey } from "../domain";
import type { OtherPlayerId } from "../domain/card-ownership";
import { CATEGORIES, cardsByCategory } from "../domain/themes";
import { HasIcon, NotIcon } from "./icons";
import styles from "./Sheet.module.css";

type SelectedCell = { cardId: CardId; playerId: number } | null;

type Props = {
  themeId: ThemeId;
  playerCount: number;
  publicCount: number;
  publicLocked: boolean;
  publicSelected: ReadonlyArray<CardId>;
  selectedCell: SelectedCell;
  getCellMark: (cardId: CardId, playerId: number) => CellMark;
  isGridDisabled: boolean;
  onTogglePublicCard: (cardId: CardId) => void;
  onCellClick: (cardId: CardId, playerId: number) => void;
  // Phase 4: Card ownership props
  selectedOwnedCard: CardId | null;
  getShownTo: (cardId: CardId) => ReadonlySet<OtherPlayerId>;
  onOwnedCardClick: (cardId: CardId) => void;
};

export function SheetGrid(props: Props) {
  const {
    themeId,
    playerCount,
    publicCount,
    publicLocked,
    publicSelected,
    selectedCell,
    getCellMark,
    isGridDisabled,
    onTogglePublicCard,
    onCellClick,
    selectedOwnedCard,
    getShownTo,
    onOwnedCardClick,
  } = props;

  const cols = Array.from({ length: playerCount }, (_, i) => i + 1);
  const selectedSet = new Set<number>(publicSelected);
  const lockedRowSet = new Set<number>(publicLocked ? publicSelected : []);

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
          publicCount={publicCount}
          publicLocked={publicLocked}
          selectedSet={selectedSet}
          lockedRowSet={lockedRowSet}
          selectedCell={selectedCell}
          getCellMark={getCellMark}
          isGridDisabled={isGridDisabled}
          onTogglePublicCard={onTogglePublicCard}
          onCellClick={onCellClick}
          selectedOwnedCard={selectedOwnedCard}
          getShownTo={getShownTo}
          onOwnedCardClick={onOwnedCardClick}
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
  publicCount: number;
  publicLocked: boolean;
  selectedSet: ReadonlySet<number>;
  lockedRowSet: ReadonlySet<number>;
  selectedCell: SelectedCell;
  getCellMark: (cardId: CardId, playerId: number) => CellMark;
  isGridDisabled: boolean;
  onTogglePublicCard: (cardId: CardId) => void;
  onCellClick: (cardId: CardId, playerId: number) => void;
  selectedOwnedCard: CardId | null;
  getShownTo: (cardId: CardId) => ReadonlySet<OtherPlayerId>;
  onOwnedCardClick: (cardId: CardId) => void;
}) {
  const {
    themeId,
    category,
    color,
    cols,
    publicCount,
    publicLocked,
    selectedSet,
    lockedRowSet,
    selectedCell,
    getCellMark,
    isGridDisabled,
    onTogglePublicCard,
    onCellClick,
    selectedOwnedCard,
    getShownTo,
    onOwnedCardClick,
  } = props;

  const needsPublicLock = publicCount > 0;
  const canSelectPublic = needsPublicLock && !publicLocked;

  return (
    <>
      {cardsByCategory(themeId, category).map((card) => {
        const isPublicSelected = selectedSet.has(card.id);
        const isRowLocked = lockedRowSet.has(card.id);

        // Check P1's mark for this card
        const p1Mark = getCellMark(card.id, 1);
        const isOwned = p1Mark.primary === "has";

        // Check if ALL cells in row are NOT (murder item detection)
        // Murder items: all cells are NOT, but NOT a public card
        const isMurderItem = !isRowLocked && cols.every((playerId) => {
          const mark = getCellMark(card.id, playerId);
          return mark.primary === "not";
        });

        // Shown-to state for owned cards
        const shownTo = getShownTo(card.id);
        const hasShownToAny = shownTo.size > 0;
        const isSelectedForShownTo = selectedOwnedCard === card.id;

        // Determine card cell click behavior
        const handleCardCellClick = () => {
          if (canSelectPublic) {
            onTogglePublicCard(card.id);
          } else if (isOwned && !isRowLocked) {
            onOwnedCardClick(card.id);
          }
        };

        const isCardClickable = canSelectPublic || (isOwned && !isRowLocked);

        // Build card cell class list
        const cardCellClasses = [
          styles.cell,
          styles.cardCell,
          canSelectPublic && styles.selectable,
          isPublicSelected && styles.selected,
          needsPublicLock && !publicLocked && styles.attention,
          isRowLocked && styles.cardLocked,
          // Owner's card - transparent background with conic gradient
          isOwned && !canSelectPublic && !isRowLocked && styles.cardOwned,
          isOwned && hasShownToAny && styles.cardOwnedWithShownTo,
          isSelectedForShownTo && styles.cardSelectedForShownTo,
          // Murder item - red border
          isMurderItem && styles.cardMurderItem,
        ]
          .filter(Boolean)
          .join(" ");

        // Card cell style
        // Owner cards: no background color (gradient handles it)
        // Murder items & others: keep category color
        const cardCellStyle: React.CSSProperties = {
          // Only apply category color if NOT an owner card
          ...(!isOwned ? !isRowLocked ? { backgroundColor: color } : { backgroundColor: "white", color: "black" } : {}),
          // Apply shown-to gradient variables for owner cards
          ...(isOwned && hasShownToAny ? getShownToStyle(shownTo) : {}),
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
                isRowLocked
                  ? "Public card (locked)"
                  : canSelectPublic
                    ? "Select/deselect as public"
                    : isOwned
                      ? "Click to track shown players"
                      : isMurderItem
                        ? "Potential murder item"
                        : undefined
              }
            >
              <span
                className={styles.cardName}
              >
                {card.name}
              </span>
            </button>

            {/* Mark cells for each player */}
            {cols.map((playerId) => {
              const isCellDisabled = isGridDisabled || isRowLocked;

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
                  isLocked={isRowLocked}
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
  onClick: () => void;
}) {
  const {
    playerId,
    categoryColor,
    mark,
    isSelected,
    isDisabled,
    isLocked,
    onClick,
  } = props;

  // Get bar stripes style (only when primary is "bars")
  const barStripeStyle = getBarStripeStyle(mark);
  const hasBars = mark.primary === "bars" && mark.barColors.size > 0;

  return (
    <button
      type="button"
      className={`${styles.cell} ${styles.markCell} ${hasBars ? styles.barsCell : ""
        } ${isSelected ? styles.cellSelected : ""} ${isDisabled ? styles.cellDisabled : ""
        } ${isLocked ? styles.cellLocked : ""}`}
      style={{
        backgroundColor: (hasBars || playerId === 1) ? undefined : isLocked ? "white" : categoryColor,
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

/** Render cell content based on primary mark + numbers overlay */
function CellContent({ mark }: { mark: CellMark }) {
  const hasNums = mark.numbers.size > 0;

  return (
    <>
      {/* Primary mark icon */}
      {mark.primary === "has" && <HasIcon width={16} height={16} />}
      {mark.primary === "not" && <NotIcon width={16} height={16} />}
      {/* "bars" and "empty" have no icon, just background/nothing */}

      {/* Numbers overlay - can appear on ANY primary type */}
      {hasNums && <NumbersOverlay numbers={mark.numbers} />}
    </>
  );
}

/** Renders white number markers as text overlay */
function NumbersOverlay({ numbers }: { numbers: ReadonlySet<NumberMarkerKey> }) {
  const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);

  return (
    <span className={styles.numbersOverlay}>
      {sortedNumbers.join("")}
    </span>
  );
}

/** Generate CSS for vertical colored bar stripes */
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

/**
 * Generate CSS custom properties for conic gradient from center
 * Each player (P2-P6) gets a 72° segment
 */
function getShownToStyle(
  shownTo: ReadonlySet<OtherPlayerId>
): React.CSSProperties {
  if (shownTo.size === 0) return {};

  return {
    "--shown-p2": shownTo.has(2) ? PLAYER_COLORS[1] : "transparent",
    "--shown-p3": shownTo.has(3) ? PLAYER_COLORS[2] : "transparent",
    "--shown-p4": shownTo.has(4) ? PLAYER_COLORS[3] : "transparent",
    "--shown-p5": shownTo.has(5) ? PLAYER_COLORS[4] : "transparent",
    "--shown-p6": shownTo.has(6) ? PLAYER_COLORS[5] : "transparent",
  } as React.CSSProperties;
}