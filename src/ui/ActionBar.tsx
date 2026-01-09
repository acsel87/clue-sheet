// src/ui/ActionBar.tsx

import styles from "./ActionBar.module.css";

type Props = {
  onUndo: () => void;
  onSettings: () => void;
  showConfirmButton?: boolean;
  onConfirm?: () => void;
};

export function ActionBar({ onUndo, onSettings, showConfirmButton, onConfirm }: Props) {
  return (
    <div className={styles.actionBar}>
      <button
        type="button"
        className={`button secondary ${styles.actionButton}`}
        onClick={onUndo}
        aria-label="Undo last action"
        title="Undo"
      >
        ↶
      </button>

      <button
        type="button"
        className={`button secondary ${styles.actionButton}`}
        onClick={onSettings}
        aria-label="Open settings"
        title="Settings"
      >
        ⚙︎
      </button>

      {showConfirmButton && onConfirm && (
        <button
          type="button"
          className={`button primary ${styles.actionButton}`}
          onClick={onConfirm}
          aria-label="Confirm selection"
          title="Confirm"
        >
          ✓
        </button>
      )}
    </div>
  );
}