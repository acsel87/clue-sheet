// src/App.tsx

import { useState, useCallback, useRef } from "react";
import { Sheet, SettingsModal } from "./ui";
import type { AppConfig } from "./domain/config";
import type { CardId } from "./domain";
import { loadConfig } from "./infra/configStorage";
import {
  type GameSetupState,
  type SetupPhase,
  createInitialSetup,
  saveGameSetup,
  clearGameSetup,
  needsSetup,
} from "./infra/gameSetup";
import "./index.css";

/** Handle exposed by Sheet for reset operations */
type SheetHandle = {
  resetAllMarks: () => void;
  resetShownTo: () => void;
};

export function App() {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [setupState, setSetupState] = useState<GameSetupState>(() =>
    createInitialSetup(config.publicCount)
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSession, setSettingsSession] = useState(0);

  // Ref to call Sheet reset methods
  const sheetRef = useRef<SheetHandle>(null);

  const setupRequired = needsSetup(config.publicCount, config.handSize);
  const effectivePhase: SetupPhase = !setupRequired ? "playing" : setupState.phase;

  function openSettings() {
    setSettingsSession((n) => n + 1);
    setSettingsOpen(true);
  }

  /**
   * Full game reset:
   * 1. Clear all cell marks
   * 2. Clear shown-to state
   * 3. Clear setup state
   * 4. Start fresh setup wizard
   */
  function resetGame() {
    // Clear all grid state via Sheet ref
    sheetRef.current?.resetAllMarks();
    sheetRef.current?.resetShownTo();

    // Clear persisted setup and restart
    clearGameSetup();
    const initial = createInitialSetup(config.publicCount);
    setSetupState(initial);
  }

  const toggleCardSelection = useCallback((cardId: CardId) => {
    setSetupState((prev) => {
      const current = new Set(prev.currentSelection);
      if (current.has(cardId)) {
        current.delete(cardId);
      } else {
        current.add(cardId);
      }
      const next: GameSetupState = {
        ...prev,
        currentSelection: Array.from(current).sort((a, b) => a - b) as CardId[],
      };
      // Note: We don't persist during setup phases (per user request)
      return next;
    });
  }, []);

  /**
   * Confirm current phase selection
   *
   * Returns the cards that were just confirmed so Sheet can apply marks
   * in the SAME event handler.
   */
  const confirmPhase = useCallback(
    (
      phase: SetupPhase,
      selectedCards: ReadonlyArray<CardId>
    ): {
      nextPhase: SetupPhase;
      confirmedCards: ReadonlyArray<CardId>;
      cardType: "public" | "owner";
    } | null => {
      let result: ReturnType<typeof confirmPhase> = null;

      setSetupState((prev) => {
        let next: GameSetupState;

        if (phase === "selectPublic") {
          const nextPhase: SetupPhase =
            config.handSize > 0 ? "selectOwner" : "playing";
          next = {
            ...prev,
            phase: nextPhase,
            publicCards: selectedCards,
            currentSelection: [],
          };
          result = {
            nextPhase,
            confirmedCards: selectedCards,
            cardType: "public",
          };
        } else if (phase === "selectOwner") {
          next = {
            ...prev,
            phase: "playing",
            ownerCards: selectedCards,
            currentSelection: [],
          };
          result = {
            nextPhase: "playing",
            confirmedCards: selectedCards,
            cardType: "owner",
          };
          // Only persist when entering "playing" phase
          saveGameSetup(next);
        } else {
          return prev;
        }

        return next;
      });

      return result;
    },
    [config.handSize]
  );

  /**
   * Handle settings save - includes auto rules now
   */
  function handleSettingsSaved(nextConfig: AppConfig) {
    setConfig(nextConfig);
  }

  function handleUndo() {
    console.log("Undo requested");
    // TODO: Implement in Phase 7
  }

  return (
    <main className="app">
      <Sheet
        ref={sheetRef}
        config={config}
        setupPhase={effectivePhase}
        publicCards={setupState.publicCards}
        ownerCards={setupState.ownerCards}
        currentSelection={setupState.currentSelection}
        onToggleCardSelection={toggleCardSelection}
        onConfirmPhase={confirmPhase}
        onUndo={handleUndo}
        onSettings={openSettings}
      />

      <SettingsModal
        key={settingsSession}
        isOpen={settingsOpen}
        activeConfig={config}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleSettingsSaved}
        onResetGridRequested={resetGame}
      />
    </main>
  );
}