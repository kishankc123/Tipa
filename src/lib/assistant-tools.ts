import { getProduct, getProductLogHistory, listLogsByDay, listProducts } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import type { ApiProduct } from "@/lib/types";

/**
 * Data fetchers behind the CopilotKit assistant's actions (see
 * src/components/copilot/inventory-assistant.tsx). Every call goes through
 * the typed functions in src/lib/api.ts, which in turn go through apiFetch,
 * so JWT headers and 401 handling stay identical to the rest of the app.
 *
 * Results are plain JSON-serializable objects: CopilotKit sends them back to
 * the LLM as the tool result AND hands them to the action's `render` prop,
 * so they're kept small and carry everything the inline cards need.
 */

export type ToolFailure = { ok: false; message: string };

export interface StockLevelResult {
  ok: true;
  slug: string;
  name: string;
  stock: number;
  unit: string | null;
  threshold: number;
  lowStock: boolean;
  isActive: boolean;
  places: { name: string; stock: number }[];
  /** Other products that also matched the search, so the model can ask. */
  otherMatches: string[];
}

export interface DailyActivity {
  date: string;
  label: string;
  logs: number;
  unitsLogged: number;
}

export interface WeeklyActivityResult {
  ok: true;
  from: string;
  to: string;
  daily: DailyActivity[];
  totalLogs: number;
  totalUnitsLogged: number;
  activeDays: number;
}

export interface ProductHistoryResult {
  ok: true;
  slug: string;
  name: string;
  total: number;
  entries: {
    loggedAt: string;
    stock: number;
    place: string;
    reviewStatus: string;
  }[];
}

export function toToolFailure(error: unknown): ToolFailure {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Something went wrong.",
  };
}

/**
 * The assistant only knows what the user typed ("milk"), not slugs, so look
 * the product up by name first (GET /products/?name=), preferring an exact
 * name/slug match, and fall back to treating the input as a slug.
 */
async function resolveProduct(
  query: string
): Promise<{ product: ApiProduct; others: string[] } | null> {
  const q = query.trim();
  if (!q) return null;

  const matches = await listProducts({ name: q });
  if (matches.length > 0) {
    const lower = q.toLowerCase();
    const product =
      matches.find((p) => p.name.toLowerCase() === lower || p.slug === q) ??
      matches[0];
    return {
      product,
      others: matches
        .filter((p) => p.slug !== product.slug)
        .slice(0, 4)
        .map((p) => p.name),
    };
  }

  try {
    return { product: await getProduct(q), others: [] };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchStockLevel(
  query: string
): Promise<StockLevelResult | ToolFailure> {
  const resolved = await resolveProduct(query);
  if (!resolved) {
    return { ok: false, message: `No product found matching "${query}".` };
  }

  const { product, others } = resolved;
  const stock = Number(product.stock);
  const threshold = Number(product.threshold);

  return {
    ok: true,
    slug: product.slug,
    name: product.name,
    stock,
    unit: product.unit_name,
    threshold,
    lowStock: threshold > 0 && stock <= threshold,
    isActive: product.is_active,
    places: product.stock_levels.map((level) => ({
      name: level.storage_place_name,
      stock: Number(level.stock),
    })),
    otherMatches: others,
  };
}

function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The last `n` calendar days ending on `today`, oldest first, as YYYY-MM-DD. */
export function lastNDays(n: number, today: Date = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() - (n - 1 - i));
    return toLocalISODate(d);
  });
}

export async function fetchWeeklyActivity(
  today: Date = new Date()
): Promise<WeeklyActivityResult> {
  const days = lastNDays(7, today);
  const rows = await listLogsByDay({ from: days[0], to: days[days.length - 1] });
  const byDate = new Map(rows.map((row) => [row.date, row]));

  const daily: DailyActivity[] = days.map((date) => {
    const row = byDate.get(date);
    return {
      date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      logs: row?.count ?? 0,
      unitsLogged: row?.total_stock ?? 0,
    };
  });

  return {
    ok: true,
    from: days[0],
    to: days[days.length - 1],
    daily,
    totalLogs: daily.reduce((sum, d) => sum + d.logs, 0),
    totalUnitsLogged: daily.reduce((sum, d) => sum + d.unitsLogged, 0),
    activeDays: daily.filter((d) => d.logs > 0).length,
  };
}

export async function fetchProductHistory(
  query: string,
  limit = 10
): Promise<ProductHistoryResult | ToolFailure> {
  const resolved = await resolveProduct(query);
  if (!resolved) {
    return { ok: false, message: `No product found matching "${query}".` };
  }

  const { product } = resolved;
  const history = await getProductLogHistory(product.slug);
  const sorted = [...history].sort((a, b) =>
    (b.logged_at ?? b.created_at).localeCompare(a.logged_at ?? a.created_at)
  );

  return {
    ok: true,
    slug: product.slug,
    name: product.name,
    total: history.length,
    entries: sorted.slice(0, limit).map((entry) => ({
      loggedAt: entry.logged_at ?? entry.created_at,
      stock: entry.logged_stock,
      place: entry.storage_place_name,
      reviewStatus: entry.review_status,
    })),
  };
}
