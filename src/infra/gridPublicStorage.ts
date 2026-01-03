// src/infra/gridPublicStorage.ts

import { DEFAULT_GRID_PUBLIC, GridPublicSchema, type GridPublicState } from ".";

const KEY = "clue_sheet_grid_public_v1";

export function loadGridPublic(): GridPublicState {
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_GRID_PUBLIC;

  try {
    const parsedUnknown: unknown = JSON.parse(raw);
    const parsed = GridPublicSchema.parse(parsedUnknown);

    // De-dupe and sort deterministically
    const uniq = Array.from(new Set(parsed.selected)).sort(
      (a, b) => a - b
    ) as GridPublicState["selected"];
    return { locked: parsed.locked, selected: uniq };
  } catch {
    return DEFAULT_GRID_PUBLIC;
  }
}

export function saveGridPublic(nextUnknown: unknown): GridPublicState {
  const parsed = GridPublicSchema.parse(nextUnknown);
  const uniq = Array.from(new Set(parsed.selected)).sort(
    (a, b) => a - b
  ) as GridPublicState["selected"];

  const stable: GridPublicState = { locked: parsed.locked, selected: uniq };
  const json = JSON.stringify(stable);
  localStorage.setItem(KEY, json);
  return stable;
}

export function clearGridPublic(): void {
  localStorage.removeItem(KEY);
}
