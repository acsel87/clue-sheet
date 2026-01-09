// src/domain/index.ts

export type { CategoryId, CardId, Card, ThemeId } from "./themes";
export { CATEGORIES, THEMES, getCards, cardsByCategory } from "./themes";

export type {
  PlayerId,
  PlayerConfig,
  AppConfig,
  AutoRuleId,
  AutoRulesConfig,
  ConstraintId,
} from "./config";
export {
  MIN_PLAYERS,
  MAX_PLAYERS,
  DEFAULT_CONFIG,
  DEFAULT_AUTO_RULES,
  PLAYER_COLORS,
  CONSTRAINT_DEPENDENCIES,
  isConstraintRequired,
} from "./config";

export { AppConfigSchema } from "./configSchema";

// Cell marks
export {
  // Types
  type CellMark,
  type PrimaryMark,
  type NumberMarkerKey, // Automation-aware "maybe" markers
  type BarColorKey, // Manual-only visual helpers

  // Constants
  NUMBER_MARKER_KEYS,
  BAR_COLOR_KEYS,
  EMPTY_MARK,

  // Predicates
  isEmptyMark,
  hasNumbers,
  hasBarColors,

  // Constructors/transformers
  createMark,
  withPrimary,
  withToggledNumber,
  withToggledBarColor,
  withoutNumber,
  withoutAllNumbers,
} from "./cell-marks";

// Bar colors (visual helper markers)
export { BAR_COLOR_HEX } from "./bar-colors";

// Card ownership & shown-to tracking (Phase 4)
export {
  type OtherPlayerId,
  type CardShownState,
  type ShownToState,
  OTHER_PLAYER_IDS,
  hasBeenShown,
  isShownToPlayer,
  toggleShownTo,
  clearShownTo,
  getShownToPlayers,
} from "./card-ownership";
