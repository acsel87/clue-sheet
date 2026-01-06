// src/ui/MarkerBar.tsx

import { useState } from "react";
import type { CellMark, MaybeColorKey } from "../domain";
import { MAYBE_COLOR_KEYS, MAYBE_COLOR_HEX } from "../domain";
import { HasIcon, NotIcon, MaybeIcon } from "./icons";
import { InfoDialog } from "./dialogs";
import styles from "./MarkerBar.module.css";

// Validation result type - structure for future real validations
export type ValidationResult = {
  allowed: boolean;
  reason?: string;
};

export type ValidationFns = {
  canMarkHas: () => ValidationResult;
  canMarkNot: () => ValidationResult;
  canToggleMaybe: (preset: MaybeColorKey) => ValidationResult;
};

type Props = {
  currentMark: CellMark;
  validation: ValidationFns;
  onMarkHas: () => void;
  onMarkNot: () => void;
  onToggleMaybe: (preset: MaybeColorKey) => void;
  onClear: () => void;
  onClose: () => void;
};

export function MarkerBar(props: Props) {
  const {
    currentMark,
    validation,
    onMarkHas,
    onMarkNot,
    onToggleMaybe,
    onClear,
    onClose,
  } = props;

  // Info dialog state for validation messages
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const hasValidation = validation.canMarkHas();
  const notValidation = validation.canMarkNot();

  const isHasSelected = currentMark.type === "has";
  const isNotSelected = currentMark.type === "not";
  const activeMaybes =
    currentMark.type === "maybe" ? currentMark.presets : new Set<MaybeColorKey>();

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

  function handleMaybeClick(preset: MaybeColorKey) {
    const maybeValidation = validation.canToggleMaybe(preset);
    if (!maybeValidation.allowed) {
      setInfoMessage(maybeValidation.reason ?? "Cannot toggle MAYBE");
      return;
    }
    onToggleMaybe(preset);
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

        {/* MAYBE buttons */}
        {MAYBE_COLOR_KEYS.map((preset) => {
          const isActive = activeMaybes.has(preset);
          const maybeValidation = validation.canToggleMaybe(preset);

          return (
            <button
              key={preset}
              type="button"
              className={`${styles.markerButton} ${isActive ? styles.selected : ""} ${!maybeValidation.allowed ? styles.disabled : ""
                }`}
              onClick={() => handleMaybeClick(preset)}
              aria-label={`Toggle MAYBE preset ${preset}`}
              aria-pressed={isActive}
              title={`MAYBE ${preset}`}
            >
              <MaybeIcon
                width={16}
                height={16}
                style={{ color: MAYBE_COLOR_HEX[preset] }}
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