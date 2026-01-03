// src/domain/index.ts

export type { loadConfig, saveConfig } from "./configStorage";

export type {
  loadGridPublic,
  saveGridPublic,
  clearGridPublic,
} from "./gridPublicStorage";

export {
  type GridPublicState,
  DEFAULT_GRID_PUBLIC,
  GridPublicSchema,
} from "./gridPublic";
