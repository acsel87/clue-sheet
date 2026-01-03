// src/ui/Sheet.tsx

import type { CardId, CategoryId, ThemeId } from "../domain/themes";
import { CATEGORIES, cardsByCategory } from "../domain/themes";

const PLACEHOLDER_COL_COUNT = 26;

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

export function Sheet(props: Props) {
  const { themeId, publicCount, publicLocked, publicSelected, onTogglePublicCard, onLockPublic } = props;

  const cols = Array.from({ length: PLACEHOLDER_COL_COUNT }, (_, i) => i + 1);
  const selectedSet = new Set<number>(publicSelected);

  const needsPublicLock = publicCount > 0;
  const isSelectionComplete = publicSelected.length === publicCount;

  return (
    <div className="sheetScroll" aria-label="Sheet scroll container">
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

      <div className="zoomGrid" style={gridStyle} aria-label="Placeholder grid for zoom testing">
        {/* Header row */}
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
              <span className="zgCardId">{card.id}</span>
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