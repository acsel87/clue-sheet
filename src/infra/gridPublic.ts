// src/domain/gridPublic.ts

import { z } from "zod";
import type { CardId } from "../domain";

export type GridPublicState = Readonly<{
  locked: boolean;
  selected: ReadonlyArray<CardId>; // persisted as array for JSON
}>;

export const DEFAULT_GRID_PUBLIC: GridPublicState = {
  locked: false,
  selected: [],
} as const;

const CardIdSchema = z.number().int().min(1).max(21);

export const GridPublicSchema = z.object({
  locked: z.boolean(),
  selected: z.array(CardIdSchema).max(21),
});
