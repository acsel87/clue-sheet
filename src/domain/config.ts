// src/domain/config.ts

import type { ThemeId } from "./";

export const MIN_PLAYERS = 2 as const;
export const MAX_PLAYERS = 6 as const;

export type PlayerId = 1 | 2 | 3 | 4 | 5 | 6;

export type PlayerConfig = Readonly<{
  id: PlayerId;
  name: string;
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
    { id: 1, name: "You" },
    { id: 2, name: "P2" },
  ],
} as const;
