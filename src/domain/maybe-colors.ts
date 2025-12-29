// src/domain/maybe-colors.ts

import * as z from "zod";

export const MAYBE_COLOR_KEYS = [
  "red",
  "blue",
  "green",
  "orange",
  "purple",
] as const;

export type MaybeColorKey = (typeof MAYBE_COLOR_KEYS)[number];

export const MAYBE_COLOR_HEX: Record<MaybeColorKey, string> = {
  red: "#FF0000",
  blue: "#0000FF",
  green: "#008000",
  orange: "#FFA500",
  purple: "#800080",
} as const;

export const MaybeColorKeySchema = z.enum(MAYBE_COLOR_KEYS);
