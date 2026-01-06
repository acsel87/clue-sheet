// src/ui/SettingsModal.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLAYER_COLORS,
  type AppConfig,
  type PlayerId,
} from "../domain/config";
import { THEMES } from "../domain/themes";
import { saveConfig } from "../infra/configStorage";
import { ConfirmDialog } from "./dialogs";

type Props = {
  isOpen: boolean;
  activeConfig: AppConfig;
  onClose: () => void;
  onSaved: (next: AppConfig) => void;
  onResetGridRequested: () => void;
};

function defaultPlayerName(id: PlayerId): string {
  return id === 1 ? "You" : `P${id}`;
}

function nextAvailablePlayerId(
  players: ReadonlyArray<{ id: PlayerId }>
): PlayerId | null {
  for (let i = 1 as PlayerId; i <= 6; i = (i + 1) as PlayerId) {
    if (!players.some((p) => p.id === i)) return i;
  }
  return null;
}

export function SettingsModal(props: Props) {
  const { isOpen, activeConfig, onClose, onSaved, onResetGridRequested } = props;

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const [draft, setDraft] = useState<AppConfig>(() => activeConfig);

  // Confirm dialog states
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (isOpen) {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) openerRef.current?.focus?.();
  }, [isOpen]);

  const canAdd = draft.players.length < MAX_PLAYERS;
  const canRemove = draft.players.length > MIN_PLAYERS;

  const playersSorted = useMemo(() => {
    return [...draft.players].sort((a, b) => a.id - b.id);
  }, [draft.players]);

  function closeWithConfirm() {
    setShowDiscardConfirm(true);
  }

  function handleDiscardConfirmed() {
    setShowDiscardConfirm(false);
    onClose();
  }

  function handleDiscardCancelled() {
    setShowDiscardConfirm(false);
  }

  function onDialogCancel(e: React.SyntheticEvent<HTMLDialogElement>) {
    e.preventDefault();
    closeWithConfirm();
  }

  function setField<K extends keyof AppConfig>(key: K, value: AppConfig[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function setPlayerName(id: PlayerId, name: string) {
    setDraft((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  }

  function addPlayer() {
    if (!canAdd) return;
    const nextId = nextAvailablePlayerId(playersSorted);
    if (!nextId) return;

    setDraft((prev) => ({
      ...prev,
      players: [
        ...prev.players,
        { id: nextId, name: defaultPlayerName(nextId), color: PLAYER_COLORS[nextId - 1]! },
      ],
    }));
  }

  function removePlayer(id: PlayerId) {
    if (!canRemove) return;
    if (id <= 2) return;

    setDraft((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== id),
    }));
  }

  function handleSaveClick() {
    setShowSaveConfirm(true);
  }

  function handleSaveConfirmed() {
    setShowSaveConfirm(false);
    try {
      const persisted = saveConfig(draft);
      onResetGridRequested();
      onSaved(persisted);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      window.alert(`Could not apply settings.\n\n${msg}`);
    }
  }

  function handleSaveCancelled() {
    setShowSaveConfirm(false);
  }

  return (
    <>
      <dialog ref={dialogRef} onCancel={onDialogCancel} className="modal">
        <form
          method="dialog"
          className="modalBody"
          onSubmit={(e) => e.preventDefault()}
        >
          <header className="modalHeader">
            <h2 className="modalTitle">Settings</h2>
            <button
              type="button"
              className="iconButton"
              onClick={closeWithConfirm}
              aria-label="Close settings"
            >
              ✕
            </button>
          </header>

          <div className="modalSection">
            <label className="field">
              <span className="label">Theme</span>
              <select
                value={draft.themeId}
                onChange={(e) =>
                  setField("themeId", e.target.value as AppConfig["themeId"])
                }
              >
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modalSection twoCols">
            <label className="field">
              <span className="label">Hand size</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={21}
                value={draft.handSize}
                onChange={(e) => setField("handSize", Number(e.target.value))}
              />
            </label>

            <label className="field">
              <span className="label">Public cards</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={21}
                value={draft.publicCount}
                onChange={(e) => setField("publicCount", Number(e.target.value))}
              />
            </label>
          </div>

          <div className="modalSection">
            <div className="sectionTitle">Players</div>

            {playersSorted.map((p) => {
              const label = p.id === 1 ? "Current player" : `Player ${p.id}`;
              const showMinus = p.id >= 3;
              const showPlus =
                p.id >= 2 &&
                p.id === playersSorted[playersSorted.length - 1]?.id &&
                canAdd;

              return (
                <div key={p.id} className="playerRow">
                  <label className="playerLabel">
                    <span className="label">{label}</span>
                    <input
                      type="text"
                      value={p.name}
                      maxLength={30}
                      onChange={(e) => setPlayerName(p.id, e.target.value)}
                    />
                  </label>

                  <div className="rowButtons">
                    {showMinus && (
                      <button
                        type="button"
                        className="smallButton"
                        onClick={() => removePlayer(p.id)}
                      >
                        −
                      </button>
                    )}
                    {showPlus && (
                      <button
                        type="button"
                        className="smallButton"
                        onClick={addPlayer}
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="modalFooter">
            <button
              type="button"
              className="button secondary"
              onClick={closeWithConfirm}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              onClick={handleSaveClick}
            >
              Save
            </button>
          </div>
        </form>
      </dialog>

      {/* Discard confirmation */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        message="Discard changes?"
        onConfirm={handleDiscardConfirmed}
        onCancel={handleDiscardCancelled}
      />

      {/* Save confirmation */}
      <ConfirmDialog
        isOpen={showSaveConfirm}
        title="Apply settings?"
        message="This will also reset the score sheet."
        confirmLabel="Apply"
        onConfirm={handleSaveConfirmed}
        onCancel={handleSaveCancelled}
      />
    </>
  );
}