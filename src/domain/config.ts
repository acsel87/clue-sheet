// src/domain/config.ts

import type { ThemeId } from "./";

export const MIN_PLAYERS = 2 as const;
export const MAX_PLAYERS = 6 as const;

export type PlayerId = 1 | 2 | 3 | 4 | 5 | 6;

export const PLAYER_COLORS: ReadonlyArray<string> = [
  "#111827f2", // background - this is ignored anyway
  "#ffffffff", // white
  "#0082c8", // blue
  "#f58231", // orange
  "#911eb4", // purple
  "#46f0f0", // cyan
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
  // Future: maybeComboRule will depend on these
  numbersOnlyOnEmptyOrBars: [], // No rules depend on this yet
  numberToggleRemovesFromColumn: [], // No rules depend on this yet
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

export type AppConfig = Readonly<{
  themeId: ThemeId;
  handSize: number;
  publicCount: number;
  players: ReadonlyArray<PlayerConfig>;
  autoRules: AutoRulesConfig;
}>;

export const DEFAULT_CONFIG: AppConfig = {
  themeId: "onePiece",
  handSize: 0,
  publicCount: 0,
  players: [
    { id: 1, name: "You", color: PLAYER_COLORS[0]! },
    { id: 2, name: "P2", color: PLAYER_COLORS[1]! },
    { id: 3, name: "P3", color: PLAYER_COLORS[2]! },
    { id: 4, name: "P4", color: PLAYER_COLORS[3]! },
  ],
  autoRules: DEFAULT_AUTO_RULES,
} as const;
