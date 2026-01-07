// src/ui/SheetGrid.tsx

import { PLAYER_COLORS, MAYBE_COLOR_HEX } from "../domain";
import type { CardId, CategoryId, ThemeId, CellMark } from "../domain";
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
  } = props;

  const needsPublicLock = publicCount > 0;
  const canSelectPublic = needsPublicLock && !publicLocked;

  return (
    <>
      {cardsByCategory(themeId, category).map((card) => {
        const isPublicSelected = selectedSet.has(card.id);
        const isRowLocked = lockedRowSet.has(card.id);

        return (
          <div
            key={card.id}
            className={`${styles.row} ${isRowLocked ? styles.lockedRow : ""}`}
            style={{ gridColumn: `1 / span ${cols.length + 1}` }}
          >
            {/* Card name cell */}
            <button
              type="button"
              className={`${styles.cell} ${styles.cardCell} ${canSelectPublic ? styles.selectable : ""
                } ${isPublicSelected ? styles.selected : ""} ${needsPublicLock && !publicLocked ? styles.attention : ""
                } ${isRowLocked ? styles.cardLocked : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => canSelectPublic && onTogglePublicCard(card.id)}
              disabled={!canSelectPublic}
              aria-disabled={!canSelectPublic}
              title={
                isRowLocked
                  ? "Public card (locked)"
                  : canSelectPublic
                    ? "Select/deselect as public"
                    : undefined
              }
            >
              <span
                className={`${styles.cardName} ${isRowLocked ? styles.cardNameStrikethrough : ""
                  }`}
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

  const maybeStyle = getMaybeQuadrantStyle(mark);

  return (
    <button
      type="button"
      className={`${styles.cell} ${styles.markCell} ${mark.type === "maybe" ? styles.maybeCell : ""
        } ${isSelected ? styles.cellSelected : ""} ${isDisabled ? styles.cellDisabled : ""
        } ${isLocked ? styles.cellLocked : ""}`}
      style={{
        backgroundColor: mark.type === "maybe" ? undefined : categoryColor,
        borderColor: PLAYER_COLORS[playerId - 1],
        ...maybeStyle,
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
  switch (mark.type) {
    case "has":
      return <HasIcon width={16} height={16} />;
    case "not":
      return <NotIcon width={16} height={16} />;
    case "maybe":
    case "empty":
    default:
      return null;
  }
}

function getMaybeQuadrantStyle(mark: CellMark): React.CSSProperties | undefined {
  if (mark.type !== "maybe") return undefined;

  const presets = mark.presets;
  return {
    "--maybe-tl": presets.has(1) ? MAYBE_COLOR_HEX[1] : "transparent",
    "--maybe-tr": presets.has(2) ? MAYBE_COLOR_HEX[2] : "transparent",
    "--maybe-bl": presets.has(3) ? MAYBE_COLOR_HEX[3] : "transparent",
    "--maybe-br": presets.has(4) ? MAYBE_COLOR_HEX[4] : "transparent",
  } as React.CSSProperties;
}