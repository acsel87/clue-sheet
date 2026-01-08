// src/domain/card-ownership.ts

/**
 * CARD OWNERSHIP & SHOWN-TO TRACKING
 *
 * This module handles tracking which cards the player (P1) owns,
 * and which other players they have shown each card to.
 *
 * Use case: During Clue gameplay, when another player asks to see
 * a card, P1 shows it. This system tracks those interactions so
 * the player knows which cards they've revealed to whom.
 *
 * Visual representation: Conic gradient on card names, where each
 * segment (72° for 5 other players) is colored if that player has
 * seen the card.
 */

import type { CardId } from "./";

/**
 * Players who can be shown cards (everyone except P1)
 * P1 is the current player who owns the cards
 */
export type OtherPlayerId = 2 | 3 | 4 | 5 | 6;
export const OTHER_PLAYER_IDS: readonly OtherPlayerId[] = [
  2, 3, 4, 5, 6,
] as const;

/**
 * Tracks which players have been shown a specific card
 */
export type CardShownState = Readonly<{
  cardId: CardId;
  shownTo: ReadonlySet<OtherPlayerId>;
}>;

/**
 * Full state for all owned cards' shown-to tracking
 * Key: CardId, Value: Set of players who have seen it
 */
export type ShownToState = ReadonlyMap<CardId, ReadonlySet<OtherPlayerId>>;

/**
 * Check if a card has been shown to any players
 */
export function hasBeenShown(state: ShownToState, cardId: CardId): boolean {
  const shownTo = state.get(cardId);
  return shownTo !== undefined && shownTo.size > 0;
}

/**
 * Check if a card has been shown to a specific player
 */
export function isShownToPlayer(
  state: ShownToState,
  cardId: CardId,
  playerId: OtherPlayerId
): boolean {
  const shownTo = state.get(cardId);
  return shownTo !== undefined && shownTo.has(playerId);
}

/**
 * Toggle whether a card has been shown to a player
 */
export function toggleShownTo(
  state: ShownToState,
  cardId: CardId,
  playerId: OtherPlayerId
): ShownToState {
  const current = state.get(cardId) ?? new Set<OtherPlayerId>();
  const next = new Set(current);

  if (next.has(playerId)) {
    next.delete(playerId);
  } else {
    next.add(playerId);
  }

  const result = new Map(state);
  if (next.size === 0) {
    result.delete(cardId);
  } else {
    result.set(cardId, next);
  }
  return result;
}

/**
 * Clear all shown-to data for a card (e.g., when card is no longer owned)
 */
export function clearShownTo(
  state: ShownToState,
  cardId: CardId
): ShownToState {
  if (!state.has(cardId)) return state;
  const result = new Map(state);
  result.delete(cardId);
  return result;
}

/**
 * Get the set of players a card has been shown to
 */
export function getShownToPlayers(
  state: ShownToState,
  cardId: CardId
): ReadonlySet<OtherPlayerId> {
  return state.get(cardId) ?? new Set<OtherPlayerId>();
}
