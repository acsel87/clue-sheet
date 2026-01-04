// src/App.tsx

import { useState } from "react";
import { Sheet } from "./ui/Sheet";
import { ActionBar } from "./ui/ActionBar";
import { SettingsModal } from "./ui/SettingsModal";
import type { AppConfig } from "./domain/config";
import { loadConfig } from "./infra/configStorage";
import { loadGridPublic, saveGridPublic, clearGridPublic } from "./infra/gridPublicStorage";
import type { GridPublicState } from "./infra";
import "./index.css";

export function App() {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [gridPublic, setGridPublic] = useState<GridPublicState>(() => loadGridPublic());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSession, setSettingsSession] = useState(0);
  const [overviewOpen, setOverviewOpen] = useState(false);

  const needsPublicLock = config.publicCount > 0;

  function openSettings() {
    setSettingsSession((n) => n + 1);
    setSettingsOpen(true);
  }

  function resetGrid() {
    clearGridPublic();
    setGridPublic({ locked: false, selected: [] });
  }

  function togglePublicCard(cardId: number) {
    if (!needsPublicLock) return;
    if (gridPublic.locked) return;

    const selected = new Set<number>(gridPublic.selected);
    const isSelected = selected.has(cardId);

    if (isSelected) {
      selected.delete(cardId);
    } else {
      if (selected.size >= config.publicCount) return;
      selected.add(cardId);
    }

    const next = { locked: false, selected: Array.from(selected).sort((a, b) => a - b) };
    const persisted = saveGridPublic(next);
    setGridPublic(persisted);
  }

  function lockPublic() {
    if (!needsPublicLock) return;
    if (gridPublic.locked) return;
    if (gridPublic.selected.length !== config.publicCount) return;

    const ok = window.confirm("Lock public cards?\n\nThis will be permanent until you reset the grid in Settings.");
    if (!ok) return;

    const next = { locked: true, selected: gridPublic.selected };
    const persisted = saveGridPublic(next);
    setGridPublic(persisted);
  }

  function handleUndo() {
    // Placeholder for undo functionality
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
        overviewOpen={overviewOpen}
        onOverviewChange={setOverviewOpen}
      />

      <ActionBar
        onUndo={handleUndo}
        onOverview={() => setOverviewOpen(true)}
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