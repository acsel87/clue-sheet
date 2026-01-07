// src/App.tsx

import { useState } from "react";
import { Sheet, SettingsModal } from "./ui";
import { } from "./ui/SettingsModal";
import type { AppConfig } from "./domain/config";
import { loadConfig } from "./infra/configStorage";
import {
  loadGridPublic,
  saveGridPublic,
  clearGridPublic,
} from "./infra/gridPublicStorage";
import type { GridPublicState } from "./infra";
import "./index.css";

export function App() {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [gridPublic, setGridPublic] = useState<GridPublicState>(() =>
    loadGridPublic()
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSession, setSettingsSession] = useState(0);

  const needsPublicLock = config.publicCount > 0;

  function openSettings() {
    setSettingsSession((n) => n + 1);
    setSettingsOpen(true);
  }

  function resetGrid() {
    clearGridPublic();
    setGridPublic({ locked: false, selected: [] });
  }

  // Simplified toggle - no limit enforcement here
  // Validation happens when user clicks the lock button
  function togglePublicCard(cardId: number) {
    if (!needsPublicLock) return;
    if (gridPublic.locked) return;

    const selected = new Set<number>(gridPublic.selected);

    if (selected.has(cardId)) {
      selected.delete(cardId);
    } else {
      // No limit check - allow selecting any number
      selected.add(cardId);
    }

    const next = {
      locked: false,
      selected: Array.from(selected).sort((a, b) => a - b),
    };
    const persisted = saveGridPublic(next);
    setGridPublic(persisted);
  }

  // Called after Sheet confirms the lock
  // At this point, validation has already passed
  function lockPublic() {
    if (!needsPublicLock) return;
    if (gridPublic.locked) return;

    const next = { locked: true, selected: gridPublic.selected };
    const persisted = saveGridPublic(next);
    setGridPublic(persisted);
  }

  function handleUndo() {
    console.log("Undo requested");
  }

  return (
    <main className="app">
      <Sheet
        themeId={config.themeId}
        publicCount={config.publicCount}
        publicLocked={needsPublicLock ? gridPublic.locked : true}
        publicSelected={needsPublicLock ? gridPublic.selected : []}
        onTogglePublicCard={(id) => togglePublicCard(id)}
        onLockPublic={lockPublic}
        onUndo={handleUndo}
        onSettings={openSettings}
      />

      <SettingsModal
        key={settingsSession}
        isOpen={settingsOpen}
        activeConfig={config}
        onClose={() => setSettingsOpen(false)}
        onSaved={(next) => setConfig(next)}
        onResetGridRequested={resetGrid}
      />
    </main>
  );
}