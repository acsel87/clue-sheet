// src/ui/PlayerSelectBar.tsx

import { PLAYER_COLORS } from "../domain";
import type { OtherPlayerId } from "../domain/card-ownership";
import { OTHER_PLAYER_IDS } from "../domain/card-ownership";
import styles from "./PlayerSelectBar.module.css";

type Props = {
  cardName: string;
  selectedPlayers: ReadonlySet<OtherPlayerId>;
  onTogglePlayer: (playerId: OtherPlayerId) => void;
  onClose: () => void;
};

/**
 * Bar for selecting which players have been shown a card
 *
 * Displays when the user clicks on an owned card name.
 * Shows player buttons (P2-P6) with their colors.
 * Selected players are highlighted.
 */
export function PlayerSelectBar(props: Props) {
  const { cardName, selectedPlayers, onTogglePlayer, onClose } = props;

  return (
    <div
      className={styles.playerSelectBar}
      role="toolbar"
      aria-label={`Select players shown ${cardName}`}
    >
      <span className={styles.label}>Shown to:</span>

      <div className={styles.playerButtons}>
        {OTHER_PLAYER_IDS.map((playerId) => {
          const isSelected = selectedPlayers.has(playerId);
          const playerColor = PLAYER_COLORS[playerId - 1];

          return (
            <button
              key={playerId}
              type="button"
              className={`${styles.playerButton} ${isSelected ? styles.selected : ""}`}
              style={{
                "--player-color": playerColor,
              } as React.CSSProperties}
              onClick={() => onTogglePlayer(playerId)}
              aria-label={`Player ${playerId} ${isSelected ? "(shown)" : "(not shown)"}`}
              aria-pressed={isSelected}
              title={`P${playerId}`}
            >
              P{playerId}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close player selection"
        title="Close"
      >
        ✕
      </button>
    </div>
  );
}