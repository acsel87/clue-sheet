// src/infra/index.ts

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

export {
  type SetupPhase,
  type GameSetupState,
  type PhaseInfo,
  GameSetupSchema,
  getInitialPhase,
  createInitialSetup,
  needsSetup,
  loadGameSetup,
  saveGameSetup,
  clearGameSetup,
  getPhaseInfo,
  validateSelection,
} from "./gameSetup";
