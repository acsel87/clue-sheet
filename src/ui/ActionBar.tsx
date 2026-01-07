// src/ui/ActionBar.tsx

import styles from "./ActionBar.module.css";

type Props = {
  onUndo: () => void;
  onSettings: () => void;
  showLockButton?: boolean;
  onLock?: () => void;
};

export function ActionBar({ onUndo, onSettings, showLockButton, onLock }: Props) {
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

      {showLockButton && onLock && (
        <button
          type="button"
          className={`button primary ${styles.actionButton}`}
          onClick={onLock}
          aria-label="Lock public cards"
          title="Lock public cards"
        >
          🔒
        </button>
      )}
    </div>
  );
}