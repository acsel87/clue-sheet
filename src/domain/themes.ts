// src/domain/themes.ts

export type CategoryId = "suspects" | "weapons" | "rooms";

export type CardId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21;

export type Card = Readonly<{
  id: CardId;
  name: string;
  category: CategoryId;
}>;

export const CATEGORIES: ReadonlyArray<
  Readonly<{ id: CategoryId; label: string }>
> = [
  { id: "suspects", label: "Suspects" },
  { id: "weapons", label: "Weapons" },
  { id: "rooms", label: "Rooms" },
] as const;

export const THEMES = [
  { id: "onePiece", label: "One Piece" },
  { id: "harryPotter", label: "Harry Potter" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const CARDS_ONE_PIECE: ReadonlyArray<Card> = [
  // Straw Hat Crew (1..6)
  { id: 1, name: "Luffy", category: "suspects" },
  { id: 2, name: "Nami/ Usopp", category: "suspects" },
  { id: 3, name: "Robin/ Franky", category: "suspects" },
  { id: 4, name: "Sanji", category: "suspects" },
  { id: 5, name: "Zoro", category: "suspects" },
  { id: 6, name: "Chopper/ Brook", category: "suspects" },

  // Treasures (7..12) — keep your corrected list here
  { id: 7, name: "Treasure Chest", category: "weapons" },
  { id: 8, name: "Binoculars", category: "weapons" },
  { id: 9, name: "Necklace", category: "weapons" },
  { id: 10, name: "Pirate Coins", category: "weapons" },
  { id: 11, name: "Meat", category: "weapons" },
  { id: 12, name: "Sword", category: "weapons" },

  // Islands (13..21) — keep your corrected list here
  { id: 13, name: "LandOf Wano", category: "rooms" },
  { id: 14, name: "FishMan Island", category: "rooms" },
  { id: 15, name: "Dressrosa", category: "rooms" },
  { id: 16, name: "Punk Hazard", category: "rooms" },
  { id: 17, name: "Drum Kingdom", category: "rooms" },
  { id: 18, name: "Marineford", category: "rooms" },
  { id: 19, name: "Whole Cake", category: "rooms" },
  { id: 20, name: "Amazon Lily", category: "rooms" },
  { id: 21, name: "Water Seven", category: "rooms" },
] as const;

const CARDS_HARRY_POTTER: ReadonlyArray<Card> = [
  // SUSPECT (1..6)
  { id: 1, name: "Fenrir Greyback", category: "suspects" },
  { id: 2, name: "Lucius Malfoy", category: "suspects" },
  { id: 3, name: "Peter Pettigrew", category: "suspects" },
  { id: 4, name: "Draco Malfoy", category: "suspects" },
  { id: 5, name: "Snatcher", category: "suspects" },
  { id: 6, name: "Bellatrix Lestrange", category: "suspects" },

  // ITEM (7..12)
  { id: 7, name: "Jinxed Broomstick", category: "weapons" },
  { id: 8, name: "Cursed Necklace", category: "weapons" },
  { id: 9, name: "Love Potion", category: "weapons" },
  { id: 10, name: "Poisoned Mead", category: "weapons" },
  { id: 11, name: "Incendio", category: "weapons" },
  { id: 12, name: "Stupefy", category: "weapons" },

  // LOCATION (13..21)
  { id: 13, name: "Malfoy Manor", category: "rooms" },
  { id: 14, name: "Hog's Head", category: "rooms" },
  { id: 15, name: "Shrieking Shack", category: "rooms" },
  { id: 16, name: "Hogwarts Castle", category: "rooms" },
  { id: 17, name: "Forbidden Forest", category: "rooms" },
  { id: 18, name: "Gringotts", category: "rooms" },
  { id: 19, name: "Weasley's Wheezes", category: "rooms" },
  { id: 20, name: "Ministry Magic", category: "rooms" },
  { id: 21, name: "Grimmauld Place", category: "rooms" },
] as const;

export function getCards(themeId: ThemeId): ReadonlyArray<Card> {
  switch (themeId) {
    case "onePiece":
      return CARDS_ONE_PIECE;
    case "harryPotter":
      return CARDS_HARRY_POTTER;
    default: {
      // Exhaustiveness guard
      const _exhaustive: never = themeId;
      return _exhaustive;
    }
  }
}

export function cardsByCategory(
  themeId: ThemeId,
  category: CategoryId
): ReadonlyArray<Card> {
  return getCards(themeId).filter((c) => c.category === category);
}
