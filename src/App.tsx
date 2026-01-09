// src/App.tsx

import { useState, useCallback } from "react";
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

export function App() {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [setupState, setSetupState] = useState<GameSetupState>(() =>
    createInitialSetup(config.publicCount)
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSession, setSettingsSession] = useState(0);

  const setupRequired = needsSetup(config.publicCount, config.handSize);
  const effectivePhase: SetupPhase = !setupRequired ? "playing" : setupState.phase;

  function openSettings() {
    setSettingsSession((n) => n + 1);
    setSettingsOpen(true);
  }

  function resetGame() {
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
      saveGameSetup(next);
      return next;
    });
  }, []);

  /**
   * Confirm current phase selection
   * 
   * Returns the cards that were just confirmed so Sheet can apply marks
   * in the SAME event handler (not via useEffect).
   * 
   * This follows React 19 best practices:
   * "Code that runs because a component was displayed should be in Effects,
   *  the rest should be in events."
   */
  const confirmPhase = useCallback(
    (phase: SetupPhase, selectedCards: ReadonlyArray<CardId>): {
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
        } else {
          return prev;
        }

        saveGameSetup(next);
        return next;
      });

      return result;
    },
    [config.handSize]
  );

  function handleUndo() {
    console.log("Undo requested");
  }

  return (
    <main className="app">
      <Sheet
        themeId={config.themeId}
        publicCount={config.publicCount}
        handSize={config.handSize}
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
        onSaved={(next) => setConfig(next)}
        onResetGridRequested={resetGame}
      />
    </main>
  );
}