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
  DerivedGameParams,
  RuleType,
  CascadeTrigger,
  RuleMeta,
} from "./config";
export {
  MIN_PLAYERS,
  MAX_PLAYERS,
  DEFAULT_CONFIG,
  DEFAULT_AUTO_RULES,
  PLAYER_COLORS,
  CONSTRAINT_DEPENDENCIES,
  RULE_DEFINITIONS,
  isConstraintRequired,
  deriveGameParams,
  createDefaultPlayer,
} from "./config";

export { AppConfigSchema } from "./configSchema";

// Cell marks
export {
  // Types
  type CellMark,
  type PrimaryMark,
  type NumberMarkerKey,
  type BarColorKey,

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

// Card ownership & shown-to tracking
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
