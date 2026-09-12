import {
  categories,
  groups,
  inventoryLogs,
  storePlaces,
  teamMembers,
  units,
} from "@/lib/mock-data";
import type {
  ApiCategory,
  ApiGroup,
  ApiProduct,
  ApiStoragePlace,
  ApiUnit,
  Category,
  EntityStatus,
  Group,
  PaginatedResponse,
  StorePlace,
  TeamMember,
  TeamRole,
  Unit,
} from "@/lib/types";
import { apiFetch } from "@/lib/api-client";

/**
 * Dummy in-memory "backend" so every action button in the app is fully
 * wired and clickable before the real Django REST API exists.
 *
 * Every export below documents the real endpoint it stands in for via a
 * `METHOD /path` comment. The full list — endpoint, file, and purpose —
 * is mirrored in API_Call.md at the repo root; that's the doc to hand to
 * the backend team. When a real endpoint lands, replace the body of the
 * matching function with a `fetch()` call — call sites do not need to
 * change, since every function here is already `async` and returns the
 * same shape a real API response would.
 */

const LATENCY_MS = 350;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

interface NamedEntity {
  id: string;
  name: string;
  status: EntityStatus;
}

function createNamedEntity<T extends NamedEntity>(
  list: T[],
  prefix: string,
  name: string,
  status: EntityStatus
): T {
  const entity = { id: generateId(prefix), name, status } as T;
  list.push(entity);
  return entity;
}

function updateNamedEntity<T extends NamedEntity>(
  list: T[],
  id: string,
  patch: Partial<Pick<T, "name" | "status">>
): T {
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) throw new Error(`Entity ${id} not found`);
  list[index] = { ...list[index], ...patch };
  return list[index];
}

function toggleNamedEntityStatus<T extends NamedEntity>(list: T[], id: string): T {
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) throw new Error(`Entity ${id} not found`);
  list[index] = {
    ...list[index],
    status: list[index].status === "active" ? "inactive" : "active",
  };
  return list[index];
}

// ---------------------------------------------------------------------
// Products (backed by the real IMS API — everything below this section,
// until Groups, talks to https://ims-v2.codex.com.np, not mock-data)
// ---------------------------------------------------------------------

export interface ProductStockInput {
  storagePlaceSlug: string;
  quantity: number;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  group: string;
  category?: string;
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  isActive: boolean;
  isPinned: boolean;
}

function toProductRequestBody(input: Partial<CreateProductInput>) {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.description !== undefined) body.description = input.description || null;
  if (input.group !== undefined) {
    body.group = input.group;
  }
  if (input.category !== undefined) body.category = input.category || null;
  if (input.unit !== undefined) {
    body.unit = input.unit || null;
    body.primary_unit = input.unit || undefined;
  }
  if (input.costPrice !== undefined) body.cost_price = String(input.costPrice);
  if (input.sellingPrice !== undefined) body.selling_price = String(input.sellingPrice);
  if (input.isActive !== undefined) body.is_active = input.isActive;
  if (input.isPinned !== undefined) body.is_pinned = input.isPinned;
  return body;
}

/** GET /api/system/products/ */
export async function listProducts(params?: {
  name?: string;
}): Promise<ApiProduct[]> {
  const results: ApiProduct[] = [];
  const query = params?.name ? `?name=${encodeURIComponent(params.name)}` : "";
  let path: string | null = `/api/system/products/${query}`;

  while (path) {
    const page: PaginatedResponse<ApiProduct> = await apiFetch(path);
    results.push(...page.results);
    path = page.next ? page.next.replace(/^https?:\/\/[^/]+/, "") : null;
  }

  return results;
}

/** GET /api/system/products/{slug}/ */
export async function getProduct(slug: string): Promise<ApiProduct> {
  return apiFetch(`/api/system/products/${slug}/`);
}

/** POST /api/system/products/ */
export async function createProduct(input: CreateProductInput): Promise<ApiProduct> {
  return apiFetch("/api/system/products/", {
    method: "POST",
    body: JSON.stringify(toProductRequestBody(input)),
  });
}

/** PATCH /api/system/products/{slug}/ */
export async function updateProduct(
  slug: string,
  patch: Partial<CreateProductInput>
): Promise<ApiProduct> {
  return apiFetch(`/api/system/products/${slug}/`, {
    method: "PATCH",
    body: JSON.stringify(toProductRequestBody(patch)),
  });
}

/**
 * POST /api/system/products/{slug}/activate/
 *
 * Verified against the live API: this endpoint unconditionally sets
 * is_active to true and ignores the request body — there is no matching
 * "deactivate" action for products (DELETE removes the row outright).
 * The `active` param is kept for a symmetric call signature with the
 * group/category/unit/store-place toggles, but passing false has no
 * effect upstream.
 */
export async function setProductActive(
  slug: string,
  active: boolean
): Promise<ApiProduct> {
  return apiFetch(`/api/system/products/${slug}/activate/`, {
    method: "POST",
    body: JSON.stringify({ is_active: active }),
  });
}

/** POST /api/system/products/{slug}/pin/ */
export async function setProductPinned(
  slug: string,
  pinned: boolean
): Promise<ApiProduct> {
  return apiFetch(`/api/system/products/${slug}/pin/`, {
    method: "POST",
    body: JSON.stringify({ is_pinned: pinned }),
  });
}

/** DELETE /api/system/products/{slug}/ */
export async function deleteProduct(slug: string): Promise<void> {
  await apiFetch(`/api/system/products/${slug}/`, { method: "DELETE" });
}

/** POST /api/system/inventory-logs/ — used right after creating a product
 *  to record its initial per-storage-place stock (Product.stock is
 *  read-only; the backend derives it from logs, not from product create). */
export async function createInventoryLogEntry(
  productSlug: string,
  stock: ProductStockInput
): Promise<void> {
  await apiFetch("/api/system/inventory-logs/", {
    method: "POST",
    body: JSON.stringify({
      product: productSlug,
      storage_place: stock.storagePlaceSlug,
      logged_stock: stock.quantity,
    }),
  });
}

/** POST /api/system/products/bulk-upload/  (multipart/form-data, field: file) */
export async function bulkImportProducts(
  file: File
): Promise<{ imported: number; fileName: string }> {
  const formData = new FormData();
  formData.append("file", file);
  await apiFetch("/api/system/products/bulk-upload/", {
    method: "POST",
    body: formData,
  });
  return { imported: 0, fileName: file.name };
}

/**
 * The real API has no sample-template endpoint yet, so this stays a
 * placeholder until one exists.
 */
export async function getBulkImportTemplateUrl(): Promise<string> {
  return delay("/api/system/products/bulk-upload/");
}

// ---------------------------------------------------------------------
// Read-only lookups against the real API, used to populate the product
// form's Group / Category / Unit / Storage Place selects with real slugs.
// (Full CRUD management for these still lives on mock-data below.)
// ---------------------------------------------------------------------

async function fetchAllPages<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = path;
  while (next) {
    const page: PaginatedResponse<T> = await apiFetch(next);
    results.push(...page.results);
    next = page.next ? page.next.replace(/^https?:\/\/[^/]+/, "") : null;
  }
  return results;
}

/** GET /api/system/groups/ */
export async function listApiGroups(): Promise<ApiGroup[]> {
  return fetchAllPages<ApiGroup>("/api/system/groups/");
}

/** GET /api/system/categories/ */
export async function listApiCategories(): Promise<ApiCategory[]> {
  return fetchAllPages<ApiCategory>("/api/system/categories/");
}

/** GET /api/system/units/ */
export async function listApiUnits(): Promise<ApiUnit[]> {
  return fetchAllPages<ApiUnit>("/api/system/units/");
}

/** GET /api/system/storage-places/ */
export async function listApiStoragePlaces(): Promise<ApiStoragePlace[]> {
  return fetchAllPages<ApiStoragePlace>("/api/system/storage-places/");
}

// ---------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------

/** POST /api/groups/ */
export async function createGroup(
  name: string,
  status: EntityStatus = "active"
): Promise<Group> {
  return delay(createNamedEntity(groups, "grp", name, status));
}

/** PATCH /api/groups/{id}/ */
export async function updateGroup(
  id: string,
  patch: Partial<Pick<Group, "name" | "status">>
): Promise<Group> {
  return delay(updateNamedEntity(groups, id, patch));
}

/** PATCH /api/groups/{id}/status/ */
export async function toggleGroupStatus(id: string): Promise<Group> {
  return delay(toggleNamedEntityStatus(groups, id));
}

// ---------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------

/** POST /api/categories/ */
export async function createCategory(
  name: string,
  status: EntityStatus = "active"
): Promise<Category> {
  return delay(createNamedEntity(categories, "cat", name, status));
}

/** PATCH /api/categories/{id}/ */
export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, "name" | "status">>
): Promise<Category> {
  return delay(updateNamedEntity(categories, id, patch));
}

/** PATCH /api/categories/{id}/status/ */
export async function toggleCategoryStatus(id: string): Promise<Category> {
  return delay(toggleNamedEntityStatus(categories, id));
}

// ---------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------

/** POST /api/units/ */
export async function createUnit(
  name: string,
  status: EntityStatus = "active"
): Promise<Unit> {
  return delay(createNamedEntity(units, "unit", name, status));
}

/** PATCH /api/units/{id}/ */
export async function updateUnit(
  id: string,
  patch: Partial<Pick<Unit, "name" | "status">>
): Promise<Unit> {
  return delay(updateNamedEntity(units, id, patch));
}

/** PATCH /api/units/{id}/status/ */
export async function toggleUnitStatus(id: string): Promise<Unit> {
  return delay(toggleNamedEntityStatus(units, id));
}

// ---------------------------------------------------------------------
// Store Places
// ---------------------------------------------------------------------

/** POST /api/store-places/ */
export async function createStorePlace(
  name: string,
  status: EntityStatus = "active"
): Promise<StorePlace> {
  return delay(createNamedEntity(storePlaces, "store", name, status));
}

/** PATCH /api/store-places/{id}/ */
export async function updateStorePlace(
  id: string,
  patch: Partial<Pick<StorePlace, "name" | "status">>
): Promise<StorePlace> {
  return delay(updateNamedEntity(storePlaces, id, patch));
}

/** PATCH /api/store-places/{id}/status/ */
export async function toggleStorePlaceStatus(id: string): Promise<StorePlace> {
  return delay(toggleNamedEntityStatus(storePlaces, id));
}

// ---------------------------------------------------------------------
// Team Members
// ---------------------------------------------------------------------

export interface CreateTeamMemberInput {
  name: string;
  email: string;
  role: TeamRole;
}

/** POST /api/team-members/ */
export async function createTeamMember(
  input: CreateTeamMemberInput
): Promise<TeamMember> {
  const member: TeamMember = {
    id: generateId("team"),
    status: "active",
    ...input,
  };
  teamMembers.push(member);
  return delay(member);
}

// ---------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------

export interface UpdateProfileInput {
  username: string;
  contactNumber: string;
  companyName: string;
}

/** PATCH /api/profile/ */
export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileInput> {
  return delay(input);
}

/** POST /api/profile/change-password/ */
export async function changePassword(_input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: true }> {
  return delay({ success: true });
}

// ---------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------

/** GET /api/logs/export/?from={from}&to={to} */
export async function exportLogs(_range: {
  from?: string;
  to?: string;
}): Promise<{ url: string; count: number }> {
  return delay({ url: "/api/logs/export/download", count: inventoryLogs.length });
}

// ---------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------

export interface ContactMessageInput {
  subject: string;
  message: string;
}

/** POST /api/support/messages/ */
export async function submitContactMessage(
  _input: ContactMessageInput
): Promise<{ success: true }> {
  return delay({ success: true });
}
