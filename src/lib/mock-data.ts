import type {
  Category,
  Group,
  InventoryLog,
  Product,
  StorePlace,
  TeamMember,
  Unit,
} from "@/lib/types";

/**
 * Placeholder data so the UI is fully navigable before the Django REST API
 * is wired up. Swap the functions in `src/lib/api.ts` for real fetch calls
 * against the backend and delete this file.
 */

export const groups: Group[] = [
  { id: "g1", name: "Produce", status: "active" },
  { id: "g2", name: "Dairy", status: "active" },
  { id: "g3", name: "Cosmetics", status: "active" },
  { id: "g4", name: "Grocery", status: "active" },
];

export const categories: Category[] = [
  { id: "c1", name: "Ii", status: "active" },
  { id: "c2", name: "I", status: "active" },
];

export const units: Unit[] = [{ id: "u1", name: "1", status: "active" }];

export const storePlaces: StorePlace[] = [
  { id: "s1", name: "Fridge", status: "active" },
];

export const products: Product[] = [
  {
    id: "p1",
    name: "Milk",
    description: "5",
    groupId: "g2",
    categoryId: "c2",
    unitId: "u1",
    price: 50,
    stock: 0,
    active: true,
    pinned: true,
    storeStock: [{ storePlaceId: "s1", quantity: 0 }],
  },
];

export const inventoryLogs: InventoryLog[] = [];

export const teamMembers: TeamMember[] = [];

export const dashboardSummary = {
  totalInventoryValue: 0,
  productCount: products.length,
  logCount: inventoryLogs.length,
  teamCount: teamMembers.length,
};
