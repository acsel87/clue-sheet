// src/ui/ActionBar.tsx

import styles from "./ActionBar.module.css";

type Props = {
  onUndo?: () => void;
  onOverview: () => void;
  onSettings?: () => void;
};

export function ActionBar({ onUndo, onOverview, onSettings }: Props) {
  return (
    <div className={styles.actionBar}>
      {onUndo &&
        <button
          type="button"
          className={`button secondary ${styles.actionButton}`}
          onClick={onUndo}
          aria-label="Undo last action"
          title="Undo"
        >
          ↶ Undo
        </button>
      }

      <button
        type="button"
        className={`button primary ${styles.actionButton}`}
        onClick={onOverview}
        aria-label="Show overview"
        title="Overview"
      >
        🗺️
      </button>

      {onSettings &&
        <button
          type="button"
          className={`button secondary ${styles.actionButton}`}
          onClick={onSettings}
          aria-label="Open settings"
          title="Settings"
        >
          ⚙︎
        </button>
      }
    </div>
  );
}