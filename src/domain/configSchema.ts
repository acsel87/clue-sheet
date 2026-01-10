// src/domain/configSchema.ts

import { z } from "zod";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  THEMES,
  DEFAULT_AUTO_RULES,
  type AppConfig,
  type PlayerId,
  type ThemeId,
  type AutoRulesConfig,
} from "./";

const ThemeIdSchema: z.ZodType<ThemeId> = z
  .enum(THEMES.map((t) => t.id) as [ThemeId, ...ThemeId[]])
  .transform((v) => v as ThemeId);

const PlayerIdSchema: z.ZodType<PlayerId> = z
  .number()
  .int()
  .min(1)
  .max(6)
  .transform((n) => n as PlayerId);

const PlayerConfigSchema: z.ZodType<AppConfig["players"][number]> = z.object({
  id: PlayerIdSchema,
  name: z.string().trim().min(1).max(30),
  color: z.string().trim().min(1).max(20),
});

/**
 * Auto Rules Schema
 *
 * Only user-toggleable rules are stored.
 */
const AutoRulesSchema: z.ZodType<AutoRulesConfig> = z
  .object({
    rowElimination: z.boolean().default(DEFAULT_AUTO_RULES.rowElimination),
    lastMaybeDeduction: z
      .boolean()
      .default(DEFAULT_AUTO_RULES.lastMaybeDeduction),
  })
  .default(DEFAULT_AUTO_RULES);

/**
 * App Config Schema
 */
export const AppConfigSchema: z.ZodType<AppConfig> = z.object({
  themeId: ThemeIdSchema,
  players: z.array(PlayerConfigSchema).min(MIN_PLAYERS).max(MAX_PLAYERS),
  autoRules: AutoRulesSchema,
});
