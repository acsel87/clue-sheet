// src/ui/hooks/useCardOwnership.ts

import { useState, useCallback } from "react";
import type { CardId } from "../../domain";
import {
  type OtherPlayerId,
  type ShownToState,
  toggleShownTo as domainToggleShownTo,
  getShownToPlayers,
  clearShownTo,
} from "../../domain/card-ownership";

/**
 * Hook for managing card ownership and shown-to tracking
 *
 * Tracks which other players (2-6) have been shown each card
 * that P1 owns. This is independent of the cell marks system.
 *
 * Note: "Ownership" is determined externally by checking if P1's
 * column has a HAS mark for a given card. This hook only manages
 * the shown-to state.
 */
export function useCardOwnership() {
  const [shownToState, setShownToState] = useState<ShownToState>(
    () => new Map()
  );

  /**
   * Toggle whether a card has been shown to a specific player
   */
  const toggleShownTo = useCallback(
    (cardId: CardId, playerId: OtherPlayerId) => {
      setShownToState((prev) => domainToggleShownTo(prev, cardId, playerId));
    },
    []
  );

  /**
   * Get the set of players a card has been shown to
   */
  const getShownTo = useCallback(
    (cardId: CardId): ReadonlySet<OtherPlayerId> => {
      return getShownToPlayers(shownToState, cardId);
    },
    [shownToState]
  );

  /**
   * Check if a card has been shown to any players
   */
  const hasBeenShownToAnyone = useCallback(
    (cardId: CardId): boolean => {
      const shownTo = shownToState.get(cardId);
      return shownTo !== undefined && shownTo.size > 0;
    },
    [shownToState]
  );

  /**
   * Clear shown-to data for a card
   * Call this when a card is no longer marked as owned (HAS removed)
   */
  const clearCardShownTo = useCallback((cardId: CardId) => {
    setShownToState((prev) => clearShownTo(prev, cardId));
  }, []);

  /**
   * Reset all shown-to state (e.g., on game reset)
   */
  const resetAll = useCallback(() => {
    setShownToState(new Map());
  }, []);

  return {
    // Accessors
    getShownTo,
    hasBeenShownToAnyone,

    // Mutations
    toggleShownTo,
    clearCardShownTo,
    resetAll,
  };
}
