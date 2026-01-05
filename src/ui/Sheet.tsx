// src/ui/Sheet.tsx

import type { CardId, CategoryId, ThemeId } from "../domain/themes";
import { CATEGORIES, cardsByCategory } from "../domain/themes";
import { ActionBar } from "./ActionBar";
import styles from "./Sheet.module.css";

const PLAYER_COL_COUNT = 6;

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

  const cols = Array.from({ length: PLAYER_COL_COUNT }, (_, i) => i + 1);
  const selectedSet = new Set<number>(publicSelected);

  const needsPublicLock = publicCount > 0;
  const isSelectionComplete = publicSelected.length === publicCount;

  return (
    <div className={styles.sheetContainer}>
      <div className={styles.gridContainer}>
        {needsPublicLock && (
          <div className={styles.publicBar}>
            <div className={styles.publicBarContent}>
              <span className={styles.publicBarTitle}>Public cards</span>
              <span className={styles.publicBarMeta}>
                {publicLocked ? "Locked" : "Unlocked"} • {publicSelected.length}/{publicCount} selected
              </span>
            </div>

            {!publicLocked ? (
              <button
                type="button"
                className="button primary"
                disabled={!isSelectionComplete}
                onClick={onLockPublic}
                aria-disabled={!isSelectionComplete}
                title={isSelectionComplete ? "Lock public cards" : "Select all public cards first"}
              >
                Lock
              </button>
            ) : (
              <span className={styles.publicLockedPill}>Locked</span>
            )}
          </div>
        )}

        <div
          className={styles.grid}
          style={{ "--player-cols": PLAYER_COL_COUNT } as React.CSSProperties}
          aria-label="Interactive score sheet grid"
        >
          {/* Header row */}
          <div className={`${styles.cell} ${styles.headerCell} ${styles.cornerCell}`}>Card</div>
          {cols.map((n) => (
            <div key={n} className={`${styles.cell} ${styles.headerCell}`}>
              C{n}
            </div>
          ))}

          {/* Category rows */}
          {CATEGORIES.map((cat) => (
            <CategoryBlock
              key={cat.id}
              themeId={themeId}
              category={cat.id}
              label={cat.label}
              cols={cols}
              publicCount={publicCount}
              publicLocked={publicLocked}
              selectedSet={selectedSet}
              onTogglePublicCard={onTogglePublicCard}
            />
          ))}
        </div>
      </div>

      <ActionBar onUndo={onUndo} onSettings={onSettings} />
    </div>
  );
}

function CategoryBlock(props: {
  themeId: ThemeId;
  category: CategoryId;
  label: string;
  cols: number[];
  publicCount: number;
  publicLocked: boolean;
  selectedSet: ReadonlySet<number>;
  onTogglePublicCard: (cardId: CardId) => void;
}) {
  const { themeId, category, cols, publicCount, publicLocked, selectedSet, onTogglePublicCard } = props;

  return (
    <>
      {/* Category divider with subtle background */}
      {/* <div className={styles.categoryDivider} style={{ gridColumn: `1 / span ${cols.length + 1}` }} /> */}

      {cardsByCategory(themeId, category).map((card) => {
        const isSelected = selectedSet.has(card.id);
        const needsPublicLock = publicCount > 0;
        const canSelect = needsPublicLock && !publicLocked;

        return (
          <div key={card.id} className={styles.row} style={{ gridColumn: `1 / span ${cols.length + 1}` }}>
            <button
              type="button"
              className={`${styles.cell} ${styles.cardCell} ${canSelect ? styles.selectable : ""} ${isSelected ? styles.selected : ""
                } ${needsPublicLock && !publicLocked ? styles.attention : ""}`}
              onClick={() => {
                if (!canSelect) return;
                onTogglePublicCard(card.id);
              }}
              disabled={!canSelect}
              aria-disabled={!canSelect}
              title={canSelect ? "Select/deselect as public" : undefined}
            >
              <span className={styles.cardName}>{card.name}</span>
            </button>

            {cols.map((n) => (
              <button
                key={n}
                type="button"
                className={`${styles.cell} ${styles.markCell}`}
                onClick={() => console.log(`Marked card ${card.id}, player ${n}`)}
                aria-label={`Mark ${card.name} for player ${n}`}
              >
                <span className={styles.markIcon}>➕</span>
              </button>
            ))}
          </div>
        );
      })}
    </>
  );
}