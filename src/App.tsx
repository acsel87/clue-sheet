// src/App.tsx

import { useState, useCallback, useRef, useMemo } from "react";
import { Sheet, SettingsModal } from "./ui";
import type { AppConfig } from "./domain/config";
import type { CardId } from "./domain";
import { getCards, deriveGameParams } from "./domain";
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

  // Derive game parameters from config
  const { handSize, publicCount } = useMemo(() => {
    const totalCards = getCards(config.themeId).length;
    const playerCount = config.players.length;
    return deriveGameParams(totalCards, playerCount);
  }, [config.themeId, config.players.length]);

  const [setupState, setSetupState] = useState<GameSetupState>(() =>
    createInitialSetup(publicCount)
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSession, setSettingsSession] = useState(0);

  // Ref to call Sheet reset methods
  const sheetRef = useRef<SheetHandle>(null);

  const setupRequired = needsSetup(publicCount, handSize);
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

    // Recalculate with current config (may have changed)
    const totalCards = getCards(config.themeId).length;
    const playerCount = config.players.length;
    const { publicCount: newPublicCount } = deriveGameParams(totalCards, playerCount);

    const initial = createInitialSetup(newPublicCount);
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
      return next;
    });
  }, []);

  /**
   * Confirm current phase selection
   *
   * Returns the cards that were just confirmed so Sheet can apply marks
   * in the SAME event handler.
   */
  function confirmPhase(
    phase: SetupPhase,
    selectedCards: ReadonlyArray<CardId>
  ): {
    nextPhase: SetupPhase;
    confirmedCards: ReadonlyArray<CardId>;
    cardType: "public" | "owner";
  } | null {
    // Calculate result BEFORE setState - no mutation inside callback
    if (phase === "selectPublic") {
      const nextPhase: SetupPhase = handSize > 0 ? "selectOwner" : "playing";

      setSetupState((prev) => ({
        ...prev,
        phase: nextPhase,
        publicCards: selectedCards,
        currentSelection: [],
      }));

      return {
        nextPhase,
        confirmedCards: selectedCards,
        cardType: "public",
      };
    }

    if (phase === "selectOwner") {
      const nextState: GameSetupState = {
        phase: "playing",
        publicCards: setupState.publicCards,
        ownerCards: selectedCards,
        currentSelection: [],
      };

      setSetupState(nextState);
      // Only persist when entering "playing" phase
      saveGameSetup(nextState);

      return {
        nextPhase: "playing",
        confirmedCards: selectedCards,
        cardType: "owner",
      };
    }

    return null;
  }

  /**
   * Handle settings save
   */
  function handleSettingsSaved(nextConfig: AppConfig) {
    setConfig(nextConfig);
  }

  function handleUndo() {
    console.log("Undo requested");
    // TODO: Implement in future phase
  }

  return (
    <main className="app">
      <Sheet
        ref={sheetRef}
        config={config}
        handSize={handSize}
        publicCount={publicCount}
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