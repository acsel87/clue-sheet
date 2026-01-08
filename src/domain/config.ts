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

export type AppConfig = Readonly<{
  themeId: ThemeId;
  handSize: number; // integer >= 0
  publicCount: number; // integer >= 0, and < handSize (your validation rule)
  players: ReadonlyArray<PlayerConfig>; // length 2..6
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
} as const;
