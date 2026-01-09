// src/infra/gameSetup.ts

/**
 * GAME SETUP STATE
 *
 * Manages the two-step setup wizard after game reset:
 * 1. Select public cards (remaining cards not dealt to players)
 * 2. Select owner cards (cards in the current player's hand)
 *
 * After both steps, the game enters "playing" phase.
 */

import { z } from "zod";
import type { CardId } from "../domain";

/**
 * Setup phases:
 * - selectPublic: Waiting for public card selection
 * - selectOwner: Waiting for owner card selection
 * - playing: Setup complete, game in progress
 */
export type SetupPhase = "selectPublic" | "selectOwner" | "playing";

export type GameSetupState = Readonly<{
  phase: SetupPhase;
  publicCards: ReadonlyArray<CardId>; // Confirmed public cards
  ownerCards: ReadonlyArray<CardId>; // Confirmed owner cards
  /** Temporary selection during current phase */
  currentSelection: ReadonlyArray<CardId>;
}>;

/**
 * Determine initial phase based on config
 */
export function getInitialPhase(publicCount: number): SetupPhase {
  // If no public cards needed, skip to owner selection
  // (Owner cards are always selected based on handSize)
  return publicCount > 0 ? "selectPublic" : "selectOwner";
}

/**
 * Create initial setup state
 */
export function createInitialSetup(publicCount: number): GameSetupState {
  return {
    phase: getInitialPhase(publicCount),
    publicCards: [],
    ownerCards: [],
    currentSelection: [],
  };
}

/**
 * Check if we need any setup at all
 * If both publicCount and handSize are 0, go straight to playing
 */
export function needsSetup(publicCount: number, handSize: number): boolean {
  return publicCount > 0 || handSize > 0;
}

// --- Zod Schema for persistence ---

const CardIdSchema = z.number().int().min(1).max(21);

export const GameSetupSchema = z.object({
  phase: z.enum(["selectPublic", "selectOwner", "playing"]),
  publicCards: z.array(CardIdSchema).max(21),
  ownerCards: z.array(CardIdSchema).max(21),
  currentSelection: z.array(CardIdSchema).max(21),
});

// --- Storage helpers ---

const KEY = "clue_sheet_game_setup_v1";

export function loadGameSetup(publicCount: number): GameSetupState {
  const raw = localStorage.getItem(KEY);
  if (!raw) return createInitialSetup(publicCount);

  try {
    const parsed: unknown = JSON.parse(raw);
    const validated = GameSetupSchema.parse(parsed);
    return validated as GameSetupState;
  } catch {
    return createInitialSetup(publicCount);
  }
}

export function saveGameSetup(state: GameSetupState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearGameSetup(): void {
  localStorage.removeItem(KEY);
}

// --- Phase transition helpers ---

export type PhaseInfo = {
  title: string;
  instruction: string;
  requiredCount: number;
  confirmLabel: string;
};

export function getPhaseInfo(
  phase: SetupPhase,
  publicCount: number,
  handSize: number
): PhaseInfo | null {
  switch (phase) {
    case "selectPublic":
      return {
        title: "Select Public Cards",
        instruction: `Select the ${publicCount} public card${
          publicCount !== 1 ? "s" : ""
        } visible to all players.`,
        requiredCount: publicCount,
        confirmLabel: "Confirm Public Cards",
      };
    case "selectOwner":
      return {
        title: "Select Your Cards",
        instruction: `Select the ${handSize} card${
          handSize !== 1 ? "s" : ""
        } in your hand.`,
        requiredCount: handSize,
        confirmLabel: "Confirm Your Cards",
      };
    case "playing":
      return null;
  }
}

/**
 * Validate current selection against required count
 */
export function validateSelection(
  selectionCount: number,
  requiredCount: number
): { valid: boolean; message?: string } {
  if (selectionCount < requiredCount) {
    return {
      valid: false,
      message: `Please select ${requiredCount - selectionCount} more card${
        requiredCount - selectionCount !== 1 ? "s" : ""
      }.`,
    };
  }
  if (selectionCount > requiredCount) {
    return {
      valid: false,
      message: `Too many cards selected. Please deselect ${
        selectionCount - requiredCount
      } card${selectionCount - requiredCount !== 1 ? "s" : ""}.`,
    };
  }
  return { valid: true };
}
