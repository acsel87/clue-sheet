// src/domain/index.ts

export type { CategoryId, Card } from "./cards";
export { CATEGORIES, CARDS, cardsByCategory } from "./cards";
export {
  MAYBE_COLOR_KEYS,
  MAYBE_COLOR_HEX,
  MaybeColorKeySchema,
  type MaybeColorKey,
} from "./maybe-colors";
