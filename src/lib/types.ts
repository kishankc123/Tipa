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

// ---------------------------------------------------------------------
// Real IMS API (products feature only — see src/lib/api.ts). These mirror
// https://ims-v2.codex.com.np/schema/ response shapes: entities are keyed
// by slug rather than id, and money fields are decimal strings.
// ---------------------------------------------------------------------

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiGroup {
  name: string;
  slug: string;
  is_active: boolean;
}

export interface ApiCategory {
  title?: string;
  name: string;
  slug: string;
  group: string | null;
  is_active: boolean;
}

export interface ApiUnit {
  name: string;
  symbol?: string;
  slug: string;
  is_active: boolean;
}

export interface ApiStoragePlace {
  name: string;
  slug: string;
  is_active: boolean;
}

export interface ApiProductStorage {
  id: number;
  storage_place: string | null;
  storage_place_name: string;
  stock: number;
  is_active: boolean;
}

export interface ApiProduct {
  owner: string;
  name: string;
  slug: string;
  description: string | null;
  group: string | null;
  group_name: string | null;
  unit: string | null;
  unit_name: string | null;
  category: string | null;
  category_name: string | null;
  primary_unit?: string;
  primary_unit_name?: string;
  stock: string;
  price: string | null;
  cost_price: string;
  selling_price: string;
  is_pinned: boolean;
  is_active: boolean;
  threshold: string;
  image: string | null;
  stock_levels: ApiProductStorage[];
}

export type TeamMemberRoleEnum = "member" | "supervisor";

export interface ApiTeamMember {
  id: number;
  username: string;
  email: string;
  business_name: string | null;
  contact_number: string | null;
  profile_image: string | null;
  is_active: boolean;
  team_owner: string;
  team_role: TeamMemberRoleEnum;
}

export interface ApiTeam {
  owner: {
    username: string;
    email: string;
    business_name: string | null;
  };
  team_members: ApiTeamMember[];
}

export interface ApiWhoami {
  id: number;
  email: string;
  username: string;
  business_name: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  team_role: string;
  contact_number: string | null;
  address: string | null;
  profile_image: string | null;
}
