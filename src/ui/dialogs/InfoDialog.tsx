// src/ui/dialogs/InfoDialog.tsx

import { useEffect, useRef } from "react";
import styles from "./dialogs.module.css";

type Props = {
  isOpen: boolean;
  title?: string | undefined;
  message: string;
  onClose: () => void;
};

export function InfoDialog({ isOpen, title, message, onClose }: Props) {
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
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${styles.infoDialog}`}
      onCancel={handleCancel}
      aria-labelledby={title ? "info-dialog-title" : undefined}
      aria-describedby="info-dialog-message"
    >
      <div className={styles.dialogBody}>
        {title && (
          <h3 id="info-dialog-title" className={styles.dialogTitle}>
            {title}
          </h3>
        )}
        <p id="info-dialog-message" className={styles.dialogMessage}>
          {message}
        </p>
        <div className={styles.dialogFooter}>
          <button
            type="button"
            className={`button primary ${styles.dialogButton}`}
            onClick={onClose}
            autoFocus
          >
            Ok
          </button>
        </div>
      </div>
    </dialog>
  );
}