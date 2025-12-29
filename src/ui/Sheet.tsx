// src/ui/Sheet.tsx

import { cardsByCategory, CATEGORIES } from "../domain"
import "../index.css"

const DEFAULT_PLAYERS = ["P1", "P2", "P3"];

export function Sheet() {
  return (
    <section className="sheet" aria-label="Deduction sheet">
      <div className="sheetHeader">
        <div className="cell cardColHeader">Card</div>
        <div className="cell publicHeader">Public</div>

        {DEFAULT_PLAYERS.map((p) => (
          <div key={p} className="playerHeader">
            <div className="cell playerName">{p}</div>
            <div className="cell factHeader">Fact</div>
            <div className="cell maybeHeader">Maybe…</div>
          </div>
        ))}
      </div>

      {CATEGORIES.map((cat) => (
        <section key={cat.id} className="category">
          <h2 className="categoryTitle">{cat.label}</h2>

          <div className="grid">
            {cardsByCategory(cat.id).map((card) => (
              <div key={card.id} className="row">
                <div className="cell cardCell">
                  <span className="cardId">{card.id}</span>
                  <span className="cardName">{card.name}</span>
                </div>

                <div className="cell publicCell" aria-label="Public mark">
                  ➕
                </div>

                {DEFAULT_PLAYERS.map((p) => (
                  <div key={p} className="playerCells">
                    <div className="cell factCell">➕</div>
                    <div className="cell maybeCell">➕</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
