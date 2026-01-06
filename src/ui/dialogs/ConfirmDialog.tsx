// src/ui/dialogs/ConfirmDialog.tsx

import { useEffect, useRef } from "react";
import styles from "./dialogs.module.css";

type Props = {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function handleCancel(e: React.SyntheticEvent<HTMLDialogElement>) {
    e.preventDefault();
    onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${styles.confirmDialog}`}
      onCancel={handleCancel}
      aria-labelledby={title ? "confirm-dialog-title" : undefined}
      aria-describedby="confirm-dialog-message"
    >
      <div className={styles.dialogBody}>
        {title && (
          <h3 id="confirm-dialog-title" className={styles.dialogTitle}>
            {title}
          </h3>
        )}
        <p id="confirm-dialog-message" className={styles.dialogMessage}>
          {message}
        </p>
        <div className={styles.dialogFooter}>
          <button
            type="button"
            className={`button secondary ${styles.dialogButton}`}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button primary ${styles.dialogButton}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}