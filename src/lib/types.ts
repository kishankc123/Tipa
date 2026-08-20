export type EntityStatus = "active" | "inactive";

export interface Group {
  id: string;
  name: string;
  status: EntityStatus;
}

export interface Category {
  id: string;
  name: string;
  status: EntityStatus;
}

export interface Unit {
  id: string;
  name: string;
  status: EntityStatus;
}

export interface StorePlace {
  id: string;
  name: string;
  status: EntityStatus;
}

export interface ProductStoreStock {
  storePlaceId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  groupId?: string;
  categoryId?: string;
  unitId?: string;
  price: number;
  stock: number;
  active: boolean;
  pinned: boolean;
  imageUrl?: string;
  storeStock: ProductStoreStock[];
}

export type LogChangeType = "increase" | "decrease" | "correction";

export interface InventoryLog {
  id: string;
  date: string;
  productId: string;
  productName: string;
  change: number;
  changeType: LogChangeType;
  note?: string;
  loggedBy: string;
}

export type TeamRole = "owner" | "manager" | "staff";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: EntityStatus;
}
