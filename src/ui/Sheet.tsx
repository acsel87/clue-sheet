// src/ui/Sheet.tsx

import { useRef, useState, useEffect } from "react";
import type { CardId, CategoryId, ThemeId } from "../domain/themes";
import { CATEGORIES, cardsByCategory } from "../domain/themes";
import styles from "./Sheet.module.css";

const PLAYER_COL_COUNT = 6;

type Props = {
  themeId: ThemeId;
  publicCount: number;
  publicLocked: boolean;
  publicSelected: ReadonlyArray<CardId>;
  onTogglePublicCard: (cardId: CardId) => void;
  onLockPublic: () => void;
  overviewOpen: boolean;
  onOverviewChange: (open: boolean) => void;
};

/**
 * Custom hook for calculating optimal scale using ResizeObserver
 */
function useGridScale(
  gridRef: React.RefObject<HTMLDivElement | null>,
  overviewMode: boolean
) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Don't call setState when overviewMode becomes false
    if (!overviewMode) return;

    const el = gridRef.current;
    if (!el) return;

    const calculateScale = () => {
      const node = gridRef.current;
      if (!node) return;

      const gridHeight = node.scrollHeight;
      const gridWidth = node.scrollWidth;

      const vv = window.visualViewport;
      const viewportH = vv?.height ?? window.innerHeight;
      const viewportW = vv?.width ?? window.innerWidth;

      // Reserve minimal space for modal header/footer (120px total)
      const availableHeight = viewportH - 120;
      const availableWidth = viewportW - 40;

      const scaleY = availableHeight / gridHeight;
      const scaleX = availableWidth / gridWidth;

      const optimalScale = Math.min(1, scaleX, scaleY);

      // Calculate translation to center the scaled element
      const scaledWidth = gridWidth * optimalScale;
      const scaledHeight = gridHeight * optimalScale;

      const translateX = Math.round((availableWidth - scaledWidth) / 2);
      const translateY = Math.round((availableHeight - scaledHeight) / 2);

      setScale(optimalScale);
      setTranslate({ x: translateX, y: translateY });
    };

    calculateScale();

    const ro = new ResizeObserver(calculateScale);
    ro.observe(el);

    const onResize = () => calculateScale();
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      ro.disconnect();
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [overviewMode, gridRef]);

  // Derive values during render instead of setState in effect
  // This follows React 19 best practices for "Don't Sync State, Derive It"
  if (!overviewMode) {
    return { scale: 1, translate: { x: 0, y: 0 } };
  }

  return { scale, translate };
}

export function Sheet(props: Props) {
  const { themeId, publicCount, publicLocked, publicSelected, onTogglePublicCard, onLockPublic, overviewOpen, onOverviewChange } = props;

  const gridRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { scale, translate } = useGridScale(gridRef, overviewOpen);

  const cols = Array.from({ length: PLAYER_COL_COUNT }, (_, i) => i + 1);
  const selectedSet = new Set<number>(publicSelected);

  const needsPublicLock = publicCount > 0;
  const isSelectionComplete = publicSelected.length === publicCount;

  // Sync dialog state with overviewOpen prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (overviewOpen && !dialog.open) {
      dialog.showModal();
    } else if (!overviewOpen && dialog.open) {
      dialog.close();
    }
  }, [overviewOpen]);

  const handleDialogClose = () => {
    onOverviewChange(false);
  };

  return (
    <>
      <div className={styles.container} role="region" aria-label="Score sheet">
        {needsPublicLock && (
          <div className={styles.publicBar} role="region" aria-label="Public cards selection">
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
          ref={gridRef}
          className={styles.grid}
          style={{ "--player-cols": PLAYER_COL_COUNT } as React.CSSProperties}
          aria-label="Interactive score sheet grid"
        >
          <div className={`${styles.cell} ${styles.headerCell} ${styles.cornerCell}`}>Card</div>
          {cols.map((n) => (
            <div key={n} className={`${styles.cell} ${styles.headerCell}`}>
              C{n}
            </div>
          ))}

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

      {/* Overview Modal */}
      <dialog
        ref={dialogRef}
        className={styles.overviewModal}
        aria-label="Score sheet overview"
        onClose={handleDialogClose}
      >
        <div className={styles.overviewContainer}>
          <div
            className={styles.overviewContent}
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transformOrigin: "0 0",
            }}
          >
            <div
              className={`${styles.grid} ${styles.overviewGrid}`}
            >
              <div className={`${styles.cell} ${styles.headerCell} ${styles.cornerCell}`}>Card</div>
              {cols.map((n) => (
                <div key={n} className={`${styles.cell} ${styles.headerCell}`}>
                  C{n}
                </div>
              ))}

              {CATEGORIES.map((cat) => (
                <CategoryBlockReadOnly
                  key={cat.id}
                  themeId={themeId}
                  category={cat.id}
                  label={cat.label}
                  cols={cols}
                  selectedSet={selectedSet}
                />
              ))}
            </div>
          </div>
        </div>
      </dialog>
    </>
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
  const { themeId, category, label, cols, publicCount, publicLocked, selectedSet, onTogglePublicCard } = props;

  return (
    <>
      <div className={styles.categoryTitle} style={{ gridColumn: `1 / span ${cols.length + 1}` }}>
        {label}
      </div>

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
              <div key={n} className={`${styles.cell} ${styles.markCell}`} aria-hidden="true">
                ➕
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function CategoryBlockReadOnly(props: {
  themeId: ThemeId;
  category: CategoryId;
  label: string;
  cols: number[];
  selectedSet: ReadonlySet<number>;
}) {
  const { themeId, category, label, cols, selectedSet } = props;

  return (
    <>
      <div className={styles.categoryTitle} style={{ gridColumn: `1 / span ${cols.length + 1}` }}>
        {label}
      </div>

      {cardsByCategory(themeId, category).map((card) => {
        const isSelected = selectedSet.has(card.id);

        return (
          <div key={card.id} className={styles.row} style={{ gridColumn: `1 / span ${cols.length + 1}` }}>
            <div
              className={`${styles.cell} ${styles.cardCell} ${styles.readOnly} ${isSelected ? styles.selected : ""
                }`}
            >
              <span className={styles.cardName}>{card.name}</span>
            </div>

            {cols.map((n) => (
              <div key={n} className={`${styles.cell} ${styles.markCell}`} aria-hidden="true">
                ➕
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}