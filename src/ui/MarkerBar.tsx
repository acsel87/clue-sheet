// src/ui/MarkerBar.tsx

import { useState } from "react";
import type { CellMark, NumberMarkerKey, BarColorKey } from "../domain";
import { BAR_COLOR_KEYS, BAR_COLOR_HEX, NUMBER_MARKER_KEYS } from "../domain";
import { HasIcon, NotIcon, MaybeIcon } from "./icons";
import { InfoDialog } from "./dialogs";
import styles from "./MarkerBar.module.css";

export type ValidationResult = {
  allowed: boolean;
  reason?: string;
};

/**
 * Validation functions for marker operations
 *
 * Note the semantic distinction:
 * - Numbers: automation-aware, may have constraints (Phase 3)
 * - Bars: manual-only, typically always allowed
 */
export type ValidationFns = {
  canMarkHas: () => ValidationResult;
  canMarkNot: () => ValidationResult;
  /** Numbers are automation-aware - constraints apply in Phase 3 */
  canToggleNumber: (num: NumberMarkerKey) => ValidationResult;
  /** Bars are manual-only helpers - typically no constraints */
  canToggleBar: (color: BarColorKey) => ValidationResult;
};

type Props = {
  currentMark: CellMark;
  validation: ValidationFns;
  onMarkHas: () => void;
  onMarkNot: () => void;
  onToggleNumber: (num: NumberMarkerKey) => void;
  onToggleBar: (color: BarColorKey) => void;
  /** Clear only primary mark, preserve numbers */
  onClearPrimary: () => void;
  /** Clear entire cell including numbers */
  onClear: () => void;
  onClose: () => void;
};

export function MarkerBar(props: Props) {
  const {
    currentMark,
    validation,
    onMarkHas,
    onMarkNot,
    onToggleNumber,
    onToggleBar,
    onClearPrimary,
    onClose,
  } = props;

  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const hasValidation = validation.canMarkHas();
  const notValidation = validation.canMarkNot();

  const isHasSelected = currentMark.primary === "has";
  const isNotSelected = currentMark.primary === "not";

  const activeNumbers = currentMark.numbers;
  const activeBarColors = currentMark.barColors;

  function handleHasClick() {
    if (!hasValidation.allowed) {
      setInfoMessage(hasValidation.reason ?? "Cannot mark as HAS");
      return;
    }
    if (isHasSelected) {
      // Toggle off: only clear primary, preserve numbers
      onClearPrimary();
    } else {
      onMarkHas();
    }
  }

  function handleNotClick() {
    if (!notValidation.allowed) {
      setInfoMessage(notValidation.reason ?? "Cannot mark as NOT");
      return;
    }
    if (isNotSelected) {
      // Toggle off: only clear primary, preserve numbers
      onClearPrimary();
    } else {
      onMarkNot();
    }
  }

  function handleNumberClick(num: NumberMarkerKey) {
    const numValidation = validation.canToggleNumber(num);
    if (!numValidation.allowed) {
      setInfoMessage(numValidation.reason ?? "Cannot toggle number marker");
      return;
    }
    onToggleNumber(num);
  }

  function handleBarClick(color: BarColorKey) {
    const barValidation = validation.canToggleBar(color);
    if (!barValidation.allowed) {
      setInfoMessage(barValidation.reason ?? "Cannot toggle color bar");
      return;
    }
    onToggleBar(color);
  }

  return (
    <>
      <div className={styles.markerBar} role="toolbar" aria-label="Cell marking options">
        {/* === PRIMARY MARKERS (HAS/NOT) === */}
        <button
          type="button"
          className={`${styles.markerButton} ${isHasSelected ? styles.selected : ""} ${!hasValidation.allowed ? styles.disabled : ""
            }`}
          onClick={handleHasClick}
          aria-label="Mark as HAS - player has this card"
          aria-pressed={isHasSelected}
          title="HAS - Player has this card"
        >
          <HasIcon width={18} height={18} />
        </button>

        <button
          type="button"
          className={`${styles.markerButton} ${isNotSelected ? styles.selected : ""} ${!notValidation.allowed ? styles.disabled : ""
            }`}
          onClick={handleNotClick}
          aria-label="Mark as NOT - player does not have this card"
          aria-pressed={isNotSelected}
          title="NOT - Player does not have this card"
        >
          <NotIcon width={18} height={18} />
        </button>

        <div className={styles.divider} />

        {/* === NUMBER MARKERS (Automation-aware "maybe" indicators) === */}
        {NUMBER_MARKER_KEYS.map((num) => {
          const isActive = activeNumbers.has(num);
          const numValidation = validation.canToggleNumber(num);

          return (
            <button
              key={`num-${num}`}
              type="button"
              className={`${styles.markerButton} ${styles.numberButton} ${isActive ? styles.selected : ""
                } ${!numValidation.allowed ? styles.disabled : ""}`}
              onClick={() => handleNumberClick(num)}
              aria-label={`Toggle maybe marker ${num}`}
              aria-pressed={isActive}
              title={`Maybe ${num} - Track possible card holders`}
            >
              {num}
            </button>
          );
        })}

        <div className={styles.divider} />

        {/* === BAR COLOR MARKERS (Manual-only visual helpers) === */}
        {BAR_COLOR_KEYS.map((color) => {
          const isActive = activeBarColors.has(color);
          const barValidation = validation.canToggleBar(color);

          return (
            <button
              key={`bar-${color}`}
              type="button"
              className={`${styles.markerButton} ${isActive ? styles.selected : ""} ${!barValidation.allowed ? styles.disabled : ""
                }`}
              onClick={() => handleBarClick(color)}
              aria-label={`Toggle color helper ${color}`}
              aria-pressed={isActive}
              title={`Color ${color} - Visual helper (manual only)`}
            >
              <MaybeIcon
                width={16}
                height={16}
                style={{ color: BAR_COLOR_HEX[color] }}
              />
            </button>
          );
        })}

        <div className={styles.divider} />

        {/* === CLOSE === */}
        <button
          type="button"
          className={styles.markerButton}
          onClick={onClose}
          aria-label="Close marker bar"
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Validation info dialog */}
      <InfoDialog
        isOpen={infoMessage !== null}
        message={infoMessage ?? ""}
        onClose={() => setInfoMessage(null)}
      />
    </>
  );
}