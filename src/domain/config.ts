// src/domain/config.ts

import type { ThemeId } from "./";

export const MIN_PLAYERS = 2 as const;
export const MAX_PLAYERS = 6 as const;

const MURDER_ITEMS_COUNT = 3;

export type PlayerId = 1 | 2 | 3 | 4 | 5 | 6;

export const PLAYER_COLORS: ReadonlyArray<string> = [
  "#111827f2", // P1 - background (ignored in most contexts)
  "#ffffffff", // P2 - white
  "#0082c8", // P3 - blue
  "#f58231", // P4 - orange
  "#911eb4", // P5 - purple
  "#46f0f0", // P6 - cyan
] as const;

export type PlayerConfig = Readonly<{
  id: PlayerId;
  name: string;
  color: string;
}>;

/**
 * USER-TOGGLEABLE AUTO RULES
 *
 * Note: Some behaviors are ALWAYS enabled and not user-configurable:
 * - Public cards auto-mark (during setup)
 * - Own cards auto-mark (during setup)
 * - Murder item detection (always applied)
 *
 * Only rules that affect gameplay strategy are toggleable.
 */
export type AutoRuleId = "rowElimination";

export type AutoRulesConfig = Readonly<{
  rowElimination: boolean;
}>;

export const DEFAULT_AUTO_RULES: AutoRulesConfig = {
  rowElimination: false,
} as const;

/**
 * CONSTRAINT-RULE DEPENDENCIES
 *
 * Maps constraints to the rules that require them.
 * A constraint is only enforced if at least one dependent rule is enabled.
 */
export type ConstraintId =
  | "numbersOnlyOnEmptyOrBars"
  | "numberToggleRemovesFromColumn";

export const CONSTRAINT_DEPENDENCIES: Record<ConstraintId, AutoRuleId[]> = {
  numbersOnlyOnEmptyOrBars: [],
  numberToggleRemovesFromColumn: [],
} as const;

/**
 * Check if a constraint should be enforced based on enabled rules
 */
export function isConstraintRequired(
  constraintId: ConstraintId,
  autoRules: AutoRulesConfig
): boolean {
  const dependentRules = CONSTRAINT_DEPENDENCIES[constraintId];
  if (dependentRules.length === 0) return false;
  return dependentRules.some((ruleId) => autoRules[ruleId]);
}

/**
 * APP CONFIGURATION
 *
 * Note: handSize and publicCount are derived from themeId and player count,
 * not stored in config. Use deriveGameParams() to calculate them.
 */
export type AppConfig = Readonly<{
  themeId: ThemeId;
  players: ReadonlyArray<PlayerConfig>;
  autoRules: AutoRulesConfig;
}>;

/**
 * Derived game parameters calculated from config
 */
export type DerivedGameParams = Readonly<{
  handSize: number;
  publicCount: number;
}>;

/**
 * Derive handSize and publicCount from total cards and player count
 *
 * Formula (excluding murder items):
 * - handSize = floor((totalCards - murderItemsCount) / playerCount)
 * - publicCount = (totalCards - murderItemsCount) % playerCount
 */
export function deriveGameParams(
  totalCards: number,
  playerCount: number
): DerivedGameParams {
  const distributableCards = totalCards - MURDER_ITEMS_COUNT;
  const handSize = Math.floor(distributableCards / playerCount);
  const publicCount = distributableCards % playerCount;
  return { handSize, publicCount };
}

/**
 * Default player configuration factory
 */
export function createDefaultPlayer(id: PlayerId): PlayerConfig {
  const name = id === 1 ? "You" : `P${id}`;
  return { id, name, color: PLAYER_COLORS[id - 1]! };
}

export const DEFAULT_CONFIG: AppConfig = {
  themeId: "onePiece",
  players: [
    createDefaultPlayer(1),
    createDefaultPlayer(2),
    createDefaultPlayer(3),
    createDefaultPlayer(4),
  ],
  autoRules: DEFAULT_AUTO_RULES,
} as const;
