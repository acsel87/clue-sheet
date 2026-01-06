// src/infra/index.ts

export type { CategoryId, CardId, Card, ThemeId } from "./themes";
export { CATEGORIES, THEMES, getCards, cardsByCategory } from "./themes";

export {
  MAYBE_COLOR_KEYS,
  MAYBE_COLOR_HEX,
  type MaybeColorKey,
} from "./maybe-colors";

export type { PlayerId, PlayerConfig, AppConfig } from "./config";
export {
  MIN_PLAYERS,
  MAX_PLAYERS,
  DEFAULT_CONFIG,
  PLAYER_COLORS,
} from "./config";

export { AppConfigSchema } from "./configSchema";

export { type CellMark, EMPTY_MARK } from "./cell-marks";
