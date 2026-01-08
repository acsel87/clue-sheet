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

export type ValidationFns = {
  canMarkHas: () => ValidationResult;
  canMarkNot: () => ValidationResult;
  canToggleBar: (color: BarColorKey) => ValidationResult;
  canToggleNumber: (num: NumberMarkerKey) => ValidationResult;
};

type Props = {
  currentMark: CellMark;
  validation: ValidationFns;
  onMarkHas: () => void;
  onMarkNot: () => void;
  onToggleBar: (color: BarColorKey) => void;
  onToggleNumber: (num: NumberMarkerKey) => void;
  onClear: () => void;
  onClose: () => void;
};

export function MarkerBar(props: Props) {
  const {
    currentMark,
    validation,
    onMarkHas,
    onMarkNot,
    onToggleBar,
    onToggleNumber,
    onClear,
    onClose,
  } = props;

  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const hasValidation = validation.canMarkHas();
  const notValidation = validation.canMarkNot();

  const isHasSelected = currentMark.primary === "has";
  const isNotSelected = currentMark.primary === "not";

  // Get active bar colors and numbers from current mark
  const activeBarColors = currentMark.barColors;
  const activeNumbers = currentMark.numbers;

  function handleHasClick() {
    if (!hasValidation.allowed) {
      setInfoMessage(hasValidation.reason ?? "Cannot mark as HAS");
      return;
    }
    if (isHasSelected) {
      onClear();
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
      onClear();
    } else {
      onMarkNot();
    }
  }

  function handleBarClick(color: BarColorKey) {
    const barValidation = validation.canToggleBar(color);
    if (!barValidation.allowed) {
      setInfoMessage(barValidation.reason ?? "Cannot toggle bar marker");
      return;
    }
    onToggleBar(color);
  }

  function handleNumberClick(num: NumberMarkerKey) {
    const numValidation = validation.canToggleNumber(num);
    if (!numValidation.allowed) {
      setInfoMessage(numValidation.reason ?? "Cannot toggle number");
      return;
    }
    onToggleNumber(num);
  }

  return (
    <>
      <div className={styles.markerBar} role="toolbar" aria-label="Cell marking options">
        {/* HAS button */}
        <button
          type="button"
          className={`${styles.markerButton} ${isHasSelected ? styles.selected : ""} ${!hasValidation.allowed ? styles.disabled : ""
            }`}
          onClick={handleHasClick}
          aria-label="Mark as HAS"
          aria-pressed={isHasSelected}
          title="Mark as HAS"
        >
          <HasIcon width={18} height={18} />
        </button>

        {/* NOT button */}
        <button
          type="button"
          className={`${styles.markerButton} ${isNotSelected ? styles.selected : ""} ${!notValidation.allowed ? styles.disabled : ""
            }`}
          onClick={handleNotClick}
          aria-label="Mark as NOT"
          aria-pressed={isNotSelected}
          title="Mark as NOT"
        >
          <NotIcon width={18} height={18} />
        </button>

        <div className={styles.divider} />

        {/* Number marker buttons (white text - will be automation-aware) */}
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
              aria-label={`Toggle number ${num}`}
              aria-pressed={isActive}
              title={`Number ${num}`}
            >
              {num}
            </button>
          );
        })}

        <div className={styles.divider} />

        {/* Bar color buttons (colored stripes - manual helper) */}
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
              aria-label={`Toggle bar color ${color}`}
              aria-pressed={isActive}
              title={`Color bar ${color}`}
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

        {/* Close button */}
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