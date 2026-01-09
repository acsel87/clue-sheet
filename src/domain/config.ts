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
 * AUTO RULES CONFIGURATION
 *
 * Each rule can be enabled/disabled by the user.
 * Some rules depend on constraints being enforced.
 */
export type AutoRuleId =
  | "murderDetection"
  | "publicCards"
  | "ownCards"
  | "columnElimination";

export type AutoRulesConfig = Readonly<{
  murderDetection: boolean;
  publicCards: boolean;
  ownCards: boolean;
  columnElimination: boolean;
}>;

export const DEFAULT_AUTO_RULES: AutoRulesConfig = {
  murderDetection: true,
  publicCards: true,
  ownCards: true,
  columnElimination: false,
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
 * Formula:
 * - handSize = floor((totalCards - murderItemsCount) / playerCount)
 * - publicCount = (totalCards - murderItemsCount) % playerCount
 */
export function deriveGameParams(
  totalCards: number,
  playerCount: number
): DerivedGameParams {
  const handSize = Math.floor((totalCards - MURDER_ITEMS_COUNT) / playerCount);
  const publicCount = (totalCards - MURDER_ITEMS_COUNT) % playerCount;
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
