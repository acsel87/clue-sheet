// src/domain/index.ts

export type { CategoryId, CardId, Card, ThemeId } from "./themes";
export { CATEGORIES, THEMES, getCards, cardsByCategory } from "./themes";

export type { PlayerId, PlayerConfig, AppConfig } from "./config";
export {
  MIN_PLAYERS,
  MAX_PLAYERS,
  DEFAULT_CONFIG,
  PLAYER_COLORS,
} from "./config";

export { AppConfigSchema } from "./configSchema";

// Cell marks - restructured
export {
  type CellMark,
  type PrimaryMark,
  type NumberMarkerKey,
  type BarColorKey,
  NUMBER_MARKER_KEYS,
  BAR_COLOR_KEYS,
  EMPTY_MARK,
  isEmptyMark,
  hasNumbers,
  createMark,
  withPrimary,
  withToggledNumber,
  withToggledBarColor,
  withoutNumber,
} from "./cell-marks";

// Bar colors (visual helper markers)
export { BAR_COLOR_HEX } from "./bar-colors";
