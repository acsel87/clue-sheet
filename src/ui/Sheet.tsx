// src/ui/Sheet.tsx

import { useRef, useState, useEffect } from "react";
import type { CardId, CategoryId, ThemeId } from "../domain/themes";
import { CATEGORIES, cardsByCategory } from "../domain/themes";

const PLACEHOLDER_COL_COUNT = 6;

type Props = {
  themeId: ThemeId;
  publicCount: number;
  publicLocked: boolean;
  publicSelected: ReadonlyArray<CardId>;
  onTogglePublicCard: (cardId: CardId) => void;
  onLockPublic: () => void;
};

type CSSVarStyle = React.CSSProperties & {
  ["--mark-cols"]?: string;
};

const gridStyle: CSSVarStyle = {
  ["--mark-cols"]: String(PLACEHOLDER_COL_COUNT),
};

/**
 * Custom hook for calculating optimal scale using ResizeObserver
 */
function useGridScale(
  gridRef: React.RefObject<HTMLDivElement | null>,
  overviewMode: boolean
) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!overviewMode) return; // when not in overview, we will return 1 (no state update)

    const el = gridRef.current;
    if (!el) return;

    const calculateScale = () => {
      const node = gridRef.current;
      if (!node) return;

      // Natural size of the grid content (not affected by CSS transform on outer containers)
      const gridHeight = node.scrollHeight;
      const gridWidth = node.scrollWidth;

      const vv = window.visualViewport;
      const viewportH = vv?.height ?? window.innerHeight;
      const viewportW = vv?.width ?? window.innerWidth;

      // Replace magic numbers if you can: measure actual paddings/headers, or pass them in.
      const availableHeight = viewportH - 180;
      const availableWidth = viewportW - 80;

      const scaleY = availableHeight / gridHeight;
      const scaleX = availableWidth / gridWidth;

      const next = Math.min(1, scaleX, scaleY);

      // Avoid redundant state updates (prevents extra renders)
      setScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
    };

    calculateScale();

    const ro = new ResizeObserver(calculateScale);
    ro.observe(el);

    const onResize = () => calculateScale();

    // visualViewport resize is particularly relevant on iOS when toolbars/pinch change the visual viewport
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      ro.disconnect();
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [overviewMode, gridRef]); // intentionally NOT depending on gridRef

  // Key point: derive "scale = 1" in render when not in overview.
  return overviewMode ? scale : 1;
}

export function Sheet(props: Props) {
  const { themeId, publicCount, publicLocked, publicSelected, onTogglePublicCard, onLockPublic } = props;

  const [overviewMode, setOverviewMode] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Custom hook handles all ref access in effects
  const scale = useGridScale(gridRef, overviewMode);

  const cols = Array.from({ length: PLACEHOLDER_COL_COUNT }, (_, i) => i + 1);
  const selectedSet = new Set<number>(publicSelected);

  const needsPublicLock = publicCount > 0;
  const isSelectionComplete = publicSelected.length === publicCount;

  const toggleOverview = () => {
    if (!overviewMode) {
      dialogRef.current?.showModal();
      setOverviewMode(true);
    } else {
      dialogRef.current?.close();
      setOverviewMode(false);
    }
  };

  const handleDialogClose = () => {
    setOverviewMode(false);
  };

  return (
    <>
      <div className="sheetScroll" tabIndex={0} role="region" aria-label="Sheet scroll container">
        {needsPublicLock && (
          <div className="publicBar" role="region" aria-label="Public cards selection">
            <div className="publicBarLeft">
              <span className="publicBarTitle">Public cards</span>
              <span className="publicBarMeta">
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
              <span className="publicLockedPill">Locked</span>
            )}
          </div>
        )}

        <div ref={gridRef} className="zoomGrid" style={gridStyle} aria-label="Interactive score sheet grid">
          {/* Header row with sticky positioning */}
          <div className="zgCell zgHeader zgCardHeader">Card</div>
          {cols.map((n) => (
            <div key={n} className="zgCell zgHeader">
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

      {/* Overview Mode Button - Fixed position */}
      <button
        type="button"
        className="button primary overviewButton"
        onClick={toggleOverview}
        aria-label={overviewMode ? "Return to normal view" : "Show overview mode"}
        title={overviewMode ? "Return to normal view" : "View entire grid at once"}
      >
        {overviewMode ? "📍 Normal View" : "🗺️ Overview"}
      </button>

      {/* Overview Modal */}
      <dialog
        ref={dialogRef}
        className="modal overviewModal"
        aria-label="Score sheet overview"
        onClose={handleDialogClose}
      >
        <div className="overviewModalHeader">
          <h3 className="overviewModalTitle">Grid Overview</h3>
          <button
            type="button"
            className="iconButton"
            onClick={toggleOverview}
            aria-label="Close overview"
          >
            ✕
          </button>
        </div>

        <div className="overviewContainer">
          <div
            className="overviewContent"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {/* Render read-only version of grid */}
            <div className="zoomGrid overviewGrid" style={gridStyle}>
              {/* Header row */}
              <div className="zgCell zgHeader zgCardHeader">Card</div>
              {cols.map((n) => (
                <div key={n} className="zgCell zgHeader">
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

        <div className="overviewModalFooter">
          <button type="button" className="button secondary" onClick={toggleOverview}>
            Close Overview
          </button>
        </div>
      </dialog>
    </>
  );
}

// Interactive category block for main grid
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
    <div className="zgCategoryBlock">
      <div className="zgCategoryTitle" style={{ gridColumn: `1 / span ${cols.length + 1}` }}>
        {label}
      </div>

      {cardsByCategory(themeId, category).map((card) => {
        const isSelected = selectedSet.has(card.id);
        const needsPublicLock = publicCount > 0;
        const canSelect = needsPublicLock && !publicLocked;

        return (
          <div key={card.id} className="zgRow" style={{ gridColumn: `1 / span ${cols.length + 1}` }}>
            <button
              type="button"
              className={[
                "zgCell",
                "zgCardCell",
                canSelect ? "zgCardCellSelectable" : "",
                isSelected ? "zgCardCellSelected" : "",
                needsPublicLock && !publicLocked ? "zgCardCellAttention" : "",
              ].join(" ")}
              onClick={() => {
                if (!canSelect) return;
                onTogglePublicCard(card.id);
              }}
              disabled={!canSelect}
              aria-disabled={!canSelect}
              title={canSelect ? "Select/deselect as public" : undefined}
            >
              <span className="zgCardName">{card.name}</span>
            </button>

            {cols.map((n) => (
              <div key={n} className="zgCell zgMarkCell" aria-hidden="true">
                ➕
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// Read-only category block for overview mode
function CategoryBlockReadOnly(props: {
  themeId: ThemeId;
  category: CategoryId;
  label: string;
  cols: number[];
  selectedSet: ReadonlySet<number>;
}) {
  const { themeId, category, label, cols, selectedSet } = props;

  return (
    <div className="zgCategoryBlock">
      <div className="zgCategoryTitle" style={{ gridColumn: `1 / span ${cols.length + 1}` }}>
        {label}
      </div>

      {cardsByCategory(themeId, category).map((card) => {
        const isSelected = selectedSet.has(card.id);

        return (
          <div key={card.id} className="zgRow" style={{ gridColumn: `1 / span ${cols.length + 1}` }}>
            <div
              className={[
                "zgCell",
                "zgCardCell",
                "zgCardCellReadOnly",
                isSelected ? "zgCardCellSelected" : "",
              ].join(" ")}
            >
              <span className="zgCardId">{card.id}</span>
              <span className="zgCardName">{card.name}</span>
            </div>

            {cols.map((n) => (
              <div key={n} className="zgCell zgMarkCell" aria-hidden="true">
                ➕
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}