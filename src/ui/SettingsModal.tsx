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
import { ConfirmDialog, InfoDialog } from "./dialogs";
import styles from "./SettingsModal.module.css";

type Props = {
  isOpen: boolean;
  activeConfig: AppConfig;
  onClose: () => void;
  onSaved: (next: AppConfig) => void;
  onResetGridRequested: () => void;
};

// --- Auto Rules Configuration ---
// These are placeholder rules - actual implementation will come during integration
type AutoRuleId = "murderDetection" | "publicCards" | "ownCards" | "columnElimination";

type AutoRule = {
  id: AutoRuleId;
  name: string;
  description: string;
  enabled: boolean;
};

const DEFAULT_AUTO_RULES: AutoRule[] = [
  {
    id: "murderDetection",
    name: "Murder item detection",
    description:
      "When all cells in a row are marked as NOT, the card name will be highlighted as a potential murder item with a red circular border.",
    enabled: true,
  },
  {
    id: "publicCards",
    name: "Public cards auto-mark",
    description:
      "When public cards are locked, all cells in those rows are automatically marked as NOT and the rows are disabled.",
    enabled: true,
  },
  {
    id: "ownCards",
    name: "Own cards auto-mark",
    description:
      "When you mark your own card as HAS, automatically mark all other cells in that row as NOT, and mark all other cards in your column as NOT.",
    enabled: true,
  },
  {
    id: "columnElimination",
    name: "Column elimination",
    description:
      "When a card is marked as HAS for any player, automatically mark all other cells in that row as NOT.",
    enabled: false,
  },
];

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

// --- Stepper Input Component ---
type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

function StepperInput({ label, value, min, max, onChange }: StepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <div className={styles.stepperWrapper}>
      <span className="label">{label}</span>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepperButton}
          onClick={() => canDecrement && onChange(value - 1)}
          disabled={!canDecrement}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className={styles.stepperValue} aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className={styles.stepperButton}
          onClick={() => canIncrement && onChange(value + 1)}
          disabled={!canIncrement}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SettingsModal(props: Props) {
  const { isOpen, activeConfig, onClose, onSaved, onResetGridRequested } = props;

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const [draft, setDraft] = useState<AppConfig>(() => activeConfig);
  const [autoRules, setAutoRules] = useState<AutoRule[]>(() => DEFAULT_AUTO_RULES);

  // Dialog states
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [ruleInfoDialog, setRuleInfoDialog] = useState<{ title: string; message: string } | null>(
    null
  );

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

  function toggleAutoRule(ruleId: AutoRuleId) {
    setAutoRules((prev) =>
      prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule))
    );
  }

  function showRuleInfo(rule: AutoRule) {
    setRuleInfoDialog({ title: rule.name, message: rule.description });
  }

  function handleSaveClick() {
    setShowSaveConfirm(true);
  }

  function handleSaveConfirmed() {
    setShowSaveConfirm(false);
    try {
      const persisted = saveConfig(draft);
      // TODO: Also persist autoRules when we implement storage for them
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

          {/* Theme Selection */}
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
                  <option key={t.id} value={t.id} className={styles.dropdownOption}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Numeric Steppers */}
          <div className="modalSection twoCols">
            <StepperInput
              label="Hand size"
              value={draft.handSize}
              min={0}
              max={21}
              onChange={(v) => setField("handSize", v)}
            />
            <StepperInput
              label="Public cards"
              value={draft.publicCount}
              min={0}
              max={21}
              onChange={(v) => setField("publicCount", v)}
            />
          </div>

          {/* Players Section */}
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
                      maxLength={3}
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

          {/* Auto Rules Section */}
          <div className={`modalSection ${styles.rulesSection}`}>
            <div className="sectionTitle">Auto Rules</div>

            {autoRules.map((rule) => (
              <div
                key={rule.id}
                className={`${styles.ruleRow} ${!rule.enabled ? styles.disabled : ""}`}
              >
                <button
                  type="button"
                  className={styles.ruleInfoButton}
                  onClick={() => showRuleInfo(rule)}
                  aria-label={`Info about ${rule.name}`}
                  title="More info"
                >
                  ?
                </button>
                <span className={styles.ruleName}>{rule.name}</span>
                <input
                  type="checkbox"
                  className={styles.ruleCheckbox}
                  checked={rule.enabled}
                  onChange={() => toggleAutoRule(rule.id)}
                  aria-label={`Enable ${rule.name}`}
                />
              </div>
            ))}
          </div>

          {/* Footer */}
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

      {/* Rule info dialog */}
      <InfoDialog
        isOpen={ruleInfoDialog !== null}
        title={ruleInfoDialog?.title}
        message={ruleInfoDialog?.message ?? ""}
        onClose={() => setRuleInfoDialog(null)}
      />
    </>
  );
}