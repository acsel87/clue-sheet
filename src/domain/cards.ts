// src/domain/cards.ts

export type CategoryId = "suspects" | "weapons" | "rooms";

export type Card = Readonly<{
  id: number; // 1..21
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

export const CARDS: ReadonlyArray<Card> = [
  // Straw Hat Crew (1..6)
  { id: 1, name: "Luffy", category: "suspects" },
  { id: 2, name: "Nami or Usopp", category: "suspects" },
  { id: 3, name: "Robin or Franky", category: "suspects" },
  { id: 4, name: "Sanji", category: "suspects" },
  { id: 5, name: "Zoro", category: "suspects" },
  { id: 6, name: "Chopper or Brook", category: "suspects" },

  // Treasures (7..12)
  { id: 7, name: "Treasure Chest", category: "weapons" },
  { id: 8, name: "Binoculars", category: "weapons" },
  { id: 9, name: "Necklace", category: "weapons" },
  { id: 10, name: "Pirate Coins", category: "weapons" },
  { id: 11, name: "Meat", category: "weapons" },
  { id: 12, name: "Sword", category: "weapons" },

  // Islands (13..21)
  { id: 13, name: "Land of Wano", category: "rooms" },
  { id: 14, name: "Fish-Man Island", category: "rooms" },
  { id: 15, name: "Dressrosa", category: "rooms" },
  { id: 16, name: "Punk Hazard", category: "rooms" },
  { id: 17, name: "Drum Kingdom", category: "rooms" },
  { id: 18, name: "Marineford", category: "rooms" },
  { id: 19, name: "Whole Cake Island", category: "rooms" },
  { id: 20, name: "Amazon Lily", category: "rooms" },
  { id: 21, name: "Water Seven", category: "rooms" },
] as const;

export function cardsByCategory(category: CategoryId): ReadonlyArray<Card> {
  return CARDS.filter((c) => c.category === category);
}
