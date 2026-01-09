// src/ui/SettingsModal.tsx

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MAX_PLAYERS,
  PLAYER_COLORS,
  type AppConfig,
  type PlayerId,
  type AutoRuleId,
  createDefaultPlayer,
  deriveGameParams,
  getCards,
} from "../domain";
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

// All possible player IDs
const ALL_PLAYER_IDS: PlayerId[] = [1, 2, 3, 4, 5, 6];

// --- Auto Rules Metadata ---
type AutoRuleMeta = {
  id: AutoRuleId;
  name: string;
  description: string;
};

const AUTO_RULES_META: AutoRuleMeta[] = [
  {
    id: "murderDetection",
    name: "Murder item detection",
    description:
      "When all cells in a row are marked as NOT, the card name will be highlighted as a potential murder item with a red circular border.",
  },
  {
    id: "publicCards",
    name: "Public cards auto-mark",
    description:
      "When public cards are confirmed, all cells in those rows are automatically marked as NOT and the rows are disabled.",
  },
  {
    id: "ownCards",
    name: "Own cards auto-mark",
    description:
      "When your cards are confirmed, your column is marked as HAS for those cards and NOT for others. Other columns are marked as NOT for your cards.",
  },
  {
    id: "columnElimination",
    name: "Column elimination",
    description:
      "When a card is marked as HAS for any player, automatically mark all other cells in that row as NOT.",
  },
];

export function SettingsModal(props: Props) {
  const { isOpen, activeConfig, onClose, onSaved, onResetGridRequested } = props;

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Draft state - initialize from activeConfig
  const [draft, setDraft] = useState<AppConfig>(() => activeConfig);

  // Track which players are enabled (derived from draft.players)
  const enabledPlayerIds = new Set(draft.players.map((p) => p.id));

  // Player names - keyed by PlayerId, includes disabled players
  const [playerNames, setPlayerNames] = useState<Record<PlayerId, string>>(() => {
    const names: Record<PlayerId, string> = {} as Record<PlayerId, string>;
    ALL_PLAYER_IDS.forEach((id) => {
      const existing = activeConfig.players.find((p) => p.id === id);
      names[id] = existing?.name ?? createDefaultPlayer(id).name;
    });
    return names;
  });

  // Scroll indicator state
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Dialog states
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [ruleInfoDialog, setRuleInfoDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Derived game params for display
  const totalCards = getCards(draft.themeId).length;
  const playerCount = draft.players.length;
  const { handSize, publicCount } = deriveGameParams(totalCards, playerCount);

  // Check scroll position to show/hide indicator
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    // Show indicator if more than 20px from bottom
    setShowScrollIndicator(distanceFromBottom > 20);
  }, []);

  // Dialog open/close management
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (isOpen) {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!el.open) el.showModal();
      // Check scroll position after dialog opens
      requestAnimationFrame(checkScrollPosition);
    } else {
      if (el.open) el.close();
    }
  }, [isOpen, checkScrollPosition]);

  // Restore focus on close
  useEffect(() => {
    if (!isOpen) openerRef.current?.focus?.();
  }, [isOpen]);

  // --- Player Toggle Logic ---

  /**
   * Toggle a player's enabled state
   * Enforces sequential constraint: disabling P(n) also disables P(n+1)...P6
   */
  function togglePlayer(id: PlayerId) {
    // P1 and P2 cannot be toggled
    if (id <= 2) return;

    const isCurrentlyEnabled = enabledPlayerIds.has(id);

    if (isCurrentlyEnabled) {
      // Disabling: also disable all higher-numbered players
      const newPlayers = draft.players.filter((p) => p.id < id);
      setDraft((prev) => ({ ...prev, players: newPlayers }));
    } else {
      // Enabling: must also enable all lower-numbered players (sequential constraint)
      // Find all players that should be enabled (all from 1 to id)
      const newPlayerIds = ALL_PLAYER_IDS.filter((pid) => pid <= id);
      const newPlayers = newPlayerIds.map((pid) => ({
        id: pid,
        name: playerNames[pid],
        color: PLAYER_COLORS[pid - 1]!,
      }));
      setDraft((prev) => ({ ...prev, players: newPlayers }));
    }
  }

  /**
   * Check if a player checkbox should be disabled
   * A checkbox is disabled if enabling it would violate sequential constraint
   */
  function isPlayerCheckboxDisabled(id: PlayerId): boolean {
    // P1 and P2 are always enabled, no checkbox shown
    if (id <= 2) return true;

    // P3 is always enabled because the previous player (P2) is never disabled
    if (id === 3) return false;

    // If this player is enabled, check if any higher player is also enabled
    // If so, we can't disable this one (would break sequence)
    if (enabledPlayerIds.has(id)) {
      for (let higher = id + 1; higher <= MAX_PLAYERS; higher++) {
        if (enabledPlayerIds.has(higher as PlayerId)) {
          return true; // Can't disable because higher player is enabled
        }
      }
      return false; // Can disable
    }

    // If this player is disabled, check if the previous player is enabled
    // Must enable in sequence
    const prevId = (id - 1) as PlayerId;
    return !enabledPlayerIds.has(prevId);
  }

  function setPlayerName(id: PlayerId, name: string) {
    setPlayerNames((prev) => ({ ...prev, [id]: name }));

    // Also update draft if player is enabled
    if (enabledPlayerIds.has(id)) {
      setDraft((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.id === id ? { ...p, name } : p)),
      }));
    }
  }

  function setField<K extends keyof AppConfig>(key: K, value: AppConfig[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAutoRule(ruleId: AutoRuleId) {
    setDraft((prev) => ({
      ...prev,
      autoRules: {
        ...prev.autoRules,
        [ruleId]: !prev.autoRules[ruleId],
      },
    }));
  }

  function showRuleInfo(rule: AutoRuleMeta) {
    setRuleInfoDialog({ title: rule.name, message: rule.description });
  }

  // --- Dialog Actions ---

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

  function handleSaveClick() {
    setShowSaveConfirm(true);
  }

  function handleSaveConfirmed() {
    setShowSaveConfirm(false);
    try {
      // Ensure player names are synced before saving
      const finalPlayers = draft.players.map((p) => ({
        ...p,
        name: playerNames[p.id],
      }));
      const finalDraft = { ...draft, players: finalPlayers };

      const persisted = saveConfig(finalDraft);
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

          {/* Scrollable content area with scroll indicator */}
          <div className={styles.scrollWrapper}>
            <div
              ref={scrollContainerRef}
              className={styles.scrollableContent}
              onScroll={checkScrollPosition}
            >
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

              {/* Derived Game Info (read-only) */}
              <div className="modalSection">
                <div className="sectionTitle">Game Setup</div>
                <div className={styles.derivedInfo}>
                  <div className={styles.derivedItem}>
                    <span className={styles.derivedLabel}>Cards per player</span>
                    <span className={styles.derivedValue}>{handSize}</span>
                  </div>
                  <div className={styles.derivedItem}>
                    <span className={styles.derivedLabel}>Public cards</span>
                    <span className={styles.derivedValue}>{publicCount}</span>
                  </div>
                </div>
              </div>

              {/* Players Section */}
              <div className="modalSection">
                <div className="sectionTitle">Players</div>

                {ALL_PLAYER_IDS.map((id) => {
                  const isEnabled = enabledPlayerIds.has(id);
                  const isAlwaysOn = id <= 2;
                  const isCheckboxDisabled = isPlayerCheckboxDisabled(id);
                  const playerColor = PLAYER_COLORS[id - 1];

                  return (
                    <div
                      key={id}
                      className={`${styles.playerRow} ${!isEnabled ? styles.playerDisabled : ""}`}
                    >
                      {/* Enable checkbox (hidden for P1/P2) */}
                      <div className={styles.playerCheckboxCell}>
                        {!isAlwaysOn && (
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => togglePlayer(id)}
                            disabled={isCheckboxDisabled}
                            className={styles.playerCheckbox}
                            aria-label={`Enable player ${id}`}
                          />
                        )}
                      </div>

                      {/* Color indicator */}
                      <div
                        className={styles.playerColorDot}
                        style={{ backgroundColor: playerColor }}
                        aria-hidden="true"
                      />

                      {/* Player label and name input */}
                      <label className={styles.playerLabel}>
                        <span className={styles.playerIdLabel}>P{id}</span>
                        <input
                          type="text"
                          value={playerNames[id]}
                          maxLength={3}
                          onChange={(e) => setPlayerName(id, e.target.value)}
                          disabled={!isEnabled}
                          className={styles.playerNameInput}
                          aria-label={`Player ${id} name`}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Auto Rules Section */}
              <div className={`modalSection ${styles.rulesSection}`}>
                <div className="sectionTitle">Auto Rules</div>

                {AUTO_RULES_META.map((rule) => {
                  const isEnabled = draft.autoRules[rule.id];

                  return (
                    <div
                      key={rule.id}
                      className={`${styles.ruleRow} ${!isEnabled ? styles.disabled : ""}`}
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
                        checked={isEnabled}
                        onChange={() => toggleAutoRule(rule.id)}
                        aria-label={`Enable ${rule.name}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scroll indicator - shows when more content below */}
            {showScrollIndicator && (
              <div className={styles.scrollIndicator} aria-hidden="true">
                <span className={styles.scrollArrow}>↓</span>
              </div>
            )}
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