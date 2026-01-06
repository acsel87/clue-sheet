// src/domain/configSchema.ts

import { z } from "zod";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  THEMES,
  type AppConfig,
  type PlayerId,
  type ThemeId,
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

export const AppConfigSchema: z.ZodType<AppConfig> = z
  .object({
    themeId: ThemeIdSchema,
    handSize: z.number().int().min(0).max(21),
    publicCount: z.number().int().min(0).max(21),
    players: z.array(PlayerConfigSchema).min(MIN_PLAYERS).max(MAX_PLAYERS),
  })
  .superRefine((val, ctx) => {
    if (!(val.publicCount < val.handSize)) {
      ctx.addIssue({
        code: "custom",
        path: ["publicCount"],
        message: "Public cards must be lower than hand size.",
      });
    }
  });
