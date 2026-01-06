// src/domain/cell-marks.ts

import type { MaybeColorKey } from "./maybe-colors";

export type CellMark =
  | { type: "empty" }
  | { type: "has" }
  | { type: "not" }
  | { type: "maybe"; presets: ReadonlySet<MaybeColorKey> };

export const EMPTY_MARK: CellMark = { type: "empty" } as const;
