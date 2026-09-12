import type {
  ApiCategory,
  ApiDashboardData,
  ApiGroup,
  ApiLogsByDay,
  ApiProduct,
  ApiProductLogEntry,
  ApiStoragePlace,
  ApiTeam,
  ApiTeamMember,
  ApiUnit,
  ApiValuationRow,
  ApiWhoami,
  Category,
  EntityStatus,
  Group,
  PaginatedResponse,
  StorePlace,
  TeamMemberRoleEnum,
  Unit,
} from "@/lib/types";
import { apiFetch, extractErrorMessage } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

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
// Shared pagination helper + read-only lookups against the real API,
// used to populate the product form's Group / Category / Unit / Storage
// Place selects with real slugs.
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
// Groups (real API). Unlike products, PATCH here genuinely supports
// is_active: false — verified against the live API — so status toggling
// doesn't need the delete-then-reactivate workaround products required.
// ---------------------------------------------------------------------

function mapGroup(g: ApiGroup): Group {
  return { id: g.slug, name: g.name, status: g.is_active ? "active" : "inactive" };
}

/** GET /api/system/groups/ */
export async function listGroups(): Promise<Group[]> {
  return (await listApiGroups()).map(mapGroup);
}

/** POST /api/system/groups/ */
export async function createGroup(
  name: string,
  status: EntityStatus = "active"
): Promise<Group> {
  const created: ApiGroup = await apiFetch("/api/system/groups/", {
    method: "POST",
    body: JSON.stringify({ name, is_active: status === "active" }),
  });
  return mapGroup(created);
}

/** PATCH /api/system/groups/{slug}/ */
export async function updateGroup(
  id: string,
  patch: Partial<Pick<Group, "name" | "status">>
): Promise<Group> {
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.status !== undefined) body.is_active = patch.status === "active";
  const updated: ApiGroup = await apiFetch(`/api/system/groups/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return mapGroup(updated);
}

/** PATCH /api/system/groups/{slug}/ (flips is_active) */
export async function toggleGroupStatus(id: string): Promise<Group> {
  const current: ApiGroup = await apiFetch(`/api/system/groups/${id}/`);
  return updateGroup(id, { status: current.is_active ? "inactive" : "active" });
}

// ---------------------------------------------------------------------
// Categories (real API)
// ---------------------------------------------------------------------

function mapCategory(c: ApiCategory): Category {
  return { id: c.slug, name: c.name, status: c.is_active ? "active" : "inactive" };
}

/** GET /api/system/categories/ */
export async function listCategories(): Promise<Category[]> {
  return (await listApiCategories()).map(mapCategory);
}

/** POST /api/system/categories/ */
export async function createCategory(
  name: string,
  status: EntityStatus = "active"
): Promise<Category> {
  const created: ApiCategory = await apiFetch("/api/system/categories/", {
    method: "POST",
    body: JSON.stringify({ name, title: name, is_active: status === "active" }),
  });
  return mapCategory(created);
}

/** PATCH /api/system/categories/{slug}/ */
export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, "name" | "status">>
): Promise<Category> {
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    body.name = patch.name;
    body.title = patch.name;
  }
  if (patch.status !== undefined) body.is_active = patch.status === "active";
  const updated: ApiCategory = await apiFetch(`/api/system/categories/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return mapCategory(updated);
}

/** PATCH /api/system/categories/{slug}/ (flips is_active) */
export async function toggleCategoryStatus(id: string): Promise<Category> {
  const current: ApiCategory = await apiFetch(`/api/system/categories/${id}/`);
  return updateCategory(id, { status: current.is_active ? "inactive" : "active" });
}

// ---------------------------------------------------------------------
// Units (real API)
// ---------------------------------------------------------------------

function mapUnit(u: ApiUnit): Unit {
  return { id: u.slug, name: u.name, status: u.is_active ? "active" : "inactive" };
}

/** GET /api/system/units/ */
export async function listUnits(): Promise<Unit[]> {
  return (await listApiUnits()).map(mapUnit);
}

/** POST /api/system/units/ */
export async function createUnit(
  name: string,
  status: EntityStatus = "active"
): Promise<Unit> {
  const created: ApiUnit = await apiFetch("/api/system/units/", {
    method: "POST",
    body: JSON.stringify({ name, is_active: status === "active" }),
  });
  return mapUnit(created);
}

/** PATCH /api/system/units/{slug}/ */
export async function updateUnit(
  id: string,
  patch: Partial<Pick<Unit, "name" | "status">>
): Promise<Unit> {
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.status !== undefined) body.is_active = patch.status === "active";
  const updated: ApiUnit = await apiFetch(`/api/system/units/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return mapUnit(updated);
}

/** PATCH /api/system/units/{slug}/ (flips is_active) */
export async function toggleUnitStatus(id: string): Promise<Unit> {
  const current: ApiUnit = await apiFetch(`/api/system/units/${id}/`);
  return updateUnit(id, { status: current.is_active ? "inactive" : "active" });
}

// ---------------------------------------------------------------------
// Store Places (real API)
// ---------------------------------------------------------------------

function mapStorePlace(s: ApiStoragePlace): StorePlace {
  return { id: s.slug, name: s.name, status: s.is_active ? "active" : "inactive" };
}

/** GET /api/system/storage-places/ */
export async function listStorePlaces(): Promise<StorePlace[]> {
  return (await listApiStoragePlaces()).map(mapStorePlace);
}

/** POST /api/system/storage-places/ */
export async function createStorePlace(
  name: string,
  status: EntityStatus = "active"
): Promise<StorePlace> {
  const created: ApiStoragePlace = await apiFetch("/api/system/storage-places/", {
    method: "POST",
    body: JSON.stringify({ name, is_active: status === "active" }),
  });
  return mapStorePlace(created);
}

/** PATCH /api/system/storage-places/{slug}/ */
export async function updateStorePlace(
  id: string,
  patch: Partial<Pick<StorePlace, "name" | "status">>
): Promise<StorePlace> {
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.status !== undefined) body.is_active = patch.status === "active";
  const updated: ApiStoragePlace = await apiFetch(`/api/system/storage-places/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return mapStorePlace(updated);
}

/** PATCH /api/system/storage-places/{slug}/ (flips is_active) */
export async function toggleStorePlaceStatus(id: string): Promise<StorePlace> {
  const current: ApiStoragePlace = await apiFetch(`/api/system/storage-places/${id}/`);
  return updateStorePlace(id, { status: current.is_active ? "inactive" : "active" });
}

// ---------------------------------------------------------------------
// Team Members (real API). GET returns the caller's single Team (owner +
// nested team_members); there's exactly one Team per account, so this
// flattens it to a plain member list for the UI.
// ---------------------------------------------------------------------

/** GET /api/system/team-members/ */
export async function listTeamMembers(): Promise<ApiTeamMember[]> {
  // Despite PaginatedTeamList in the spec, this endpoint actually returns
  // a single Team object directly ({owner, team_members}), not a
  // {count, results} page — verified against the live API.
  const team = await apiFetch<ApiTeam>("/api/system/team-members/");
  return team.team_members;
}

export interface CreateTeamMemberInput {
  username: string;
  email: string;
  password: string;
  role: TeamMemberRoleEnum;
}

/** POST /api/system/team-members/ */
export async function createTeamMember(
  input: CreateTeamMemberInput
): Promise<ApiTeamMember> {
  return apiFetch("/api/system/team-members/", {
    method: "POST",
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      password: input.password,
      team_role: input.role,
    }),
  });
}

/** PATCH /api/system/team-members/{id}/ */
export async function setTeamMemberActive(
  id: number,
  active: boolean
): Promise<ApiTeamMember> {
  return apiFetch(`/api/system/team-members/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: active }),
  });
}

// ---------------------------------------------------------------------
// Profile (real API)
// ---------------------------------------------------------------------

/** GET /api/system/auth/whoami/ */
export async function getCurrentUser(): Promise<ApiWhoami> {
  const res = await apiFetch<{ status: boolean; data: ApiWhoami }>(
    "/api/system/auth/whoami/"
  );
  return res.data;
}

export interface UpdateProfileInput {
  username: string;
  contactNumber?: string;
  businessName?: string;
}

/** PATCH /api/system/auth/profile/ */
export async function updateProfile(input: UpdateProfileInput): Promise<ApiWhoami> {
  const res = await apiFetch<{ status: boolean; data: ApiWhoami }>(
    "/api/system/auth/profile/",
    {
      method: "PATCH",
      body: JSON.stringify({
        username: input.username,
        business_name: input.businessName,
        contact_number: input.contactNumber,
      }),
    }
  );
  return res.data;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/** POST /api/system/auth/profile/change-password/ */
export async function changePassword(
  input: ChangePasswordInput
): Promise<{ success: true }> {
  await apiFetch("/api/system/auth/profile/change-password/", {
    method: "POST",
    body: JSON.stringify({
      current_password: input.currentPassword,
      new_password: input.newPassword,
      confirm_new_password: input.confirmNewPassword,
    }),
  });
  return { success: true };
}

// ---------------------------------------------------------------------
// Dashboard, Logs & Reports (real API)
// ---------------------------------------------------------------------

/**
 * GET /api/system/inventory-logs/dashboard/ — one call that bundles
 * everything the Dashboard page needs (stats, this-month calendar
 * activity, a daily quantity chart, and pinned products). The OpenAPI
 * spec claims this returns an InventoryLogCreate; it actually returns
 * the shape in ApiDashboardData, verified against the live API.
 */
export async function getDashboardData(): Promise<ApiDashboardData> {
  return apiFetch("/api/system/inventory-logs/dashboard/");
}

/** GET /api/system/inventory-logs/by-day/ */
export async function listLogsByDay(range?: {
  from?: string;
  to?: string;
}): Promise<ApiLogsByDay[]> {
  const query = new URLSearchParams();
  if (range?.from) query.set("start_date", range.from);
  if (range?.to) query.set("end_date", range.to);
  const qs = query.toString();
  return fetchAllPages<ApiLogsByDay>(
    `/api/system/inventory-logs/by-day/${qs ? `?${qs}` : ""}`
  );
}

/** GET /api/system/inventory-logs/by-product/?product={slug} */
export async function getProductLogHistory(
  productSlug: string
): Promise<ApiProductLogEntry[]> {
  return fetchAllPages<ApiProductLogEntry>(
    `/api/system/inventory-logs/by-product/?product=${encodeURIComponent(productSlug)}`
  );
}

/**
 * GET /api/system/products/valuation-report/ — paginated like the other
 * list endpoints, but the page envelope also carries `total_value` (the
 * grand total across *all* pages, not just the current one) alongside
 * the usual count/results/next/previous, so this can't reuse
 * fetchAllPages unmodified.
 */
export async function getValuationReport(
  search?: string
): Promise<{ rows: ApiValuationRow[]; totalValue: number }> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  const rows: ApiValuationRow[] = [];
  let path: string | null = `/api/system/products/valuation-report/${qs}`;
  let totalValue = 0;

  while (path) {
    const page: PaginatedResponse<ApiValuationRow> & { total_value: number } =
      await apiFetch(path);
    rows.push(...page.results);
    totalValue = page.total_value;
    path = page.next ? page.next.replace(/^https?:\/\/[^/]+/, "") : null;
  }

  return { rows, totalValue };
}

/**
 * POST /api/system/inventory-logs/export/ — returns an XLSX file
 * directly (not JSON), so this bypasses apiFetch and reads a Blob.
 */
export async function exportLogs(range: {
  from: string;
  to: string;
}): Promise<{ blob: Blob; filename: string }> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/system/inventory-logs/export/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ from_date: range.from, to_date: range.to }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(extractErrorMessage(body, "Failed to export logs."));
  }

  const blob = await res.blob();
  return { blob, filename: `inventory-logs_${range.from}_to_${range.to}.xlsx` };
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
