import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import {
  fetchProductHistory,
  fetchStockLevel,
  fetchWeeklyActivity,
  lastNDays,
} from "@/lib/assistant-tools";
import type { ApiProduct } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  listProducts: vi.fn(),
  getProduct: vi.fn(),
  listLogsByDay: vi.fn(),
  getProductLogHistory: vi.fn(),
}));

function product(overrides: Partial<ApiProduct> = {}): ApiProduct {
  return {
    owner: "owner",
    name: "Milk",
    slug: "milk",
    description: null,
    group: null,
    group_name: null,
    unit: "ltr",
    unit_name: "Litre",
    category: null,
    category_name: null,
    stock: "12.00",
    price: null,
    cost_price: "40",
    selling_price: "50",
    is_pinned: false,
    is_active: true,
    threshold: "5",
    image: null,
    stock_levels: [
      {
        id: 1,
        storage_place: "fridge",
        storage_place_name: "Fridge",
        stock: 12,
        is_active: true,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("fetchStockLevel", () => {
  it("prefers an exact name match and lists other matches", async () => {
    vi.mocked(api.listProducts).mockResolvedValue([
      product({ name: "Milk Powder", slug: "milk-powder" }),
      product(),
    ]);

    const result = await fetchStockLevel("milk");

    expect(api.listProducts).toHaveBeenCalledWith({ name: "milk" });
    expect(result).toMatchObject({
      ok: true,
      slug: "milk",
      stock: 12,
      unit: "Litre",
      lowStock: false,
      otherMatches: ["Milk Powder"],
      places: [{ name: "Fridge", stock: 12 }],
    });
  });

  it("flags low stock when stock is at or below the threshold", async () => {
    vi.mocked(api.listProducts).mockResolvedValue([
      product({ stock: "5.00", threshold: "5" }),
    ]);
    expect(await fetchStockLevel("milk")).toMatchObject({ lowStock: true });
  });

  it("never flags low stock when no threshold is set", async () => {
    vi.mocked(api.listProducts).mockResolvedValue([
      product({ stock: "0", threshold: "0" }),
    ]);
    expect(await fetchStockLevel("milk")).toMatchObject({ lowStock: false });
  });

  it("falls back to a slug lookup, and reports not-found on a 404", async () => {
    vi.mocked(api.listProducts).mockResolvedValue([]);
    vi.mocked(api.getProduct).mockResolvedValueOnce(product());
    expect(await fetchStockLevel("milk")).toMatchObject({ ok: true });

    vi.mocked(api.getProduct).mockRejectedValueOnce(
      new ApiError(404, "Not found", null)
    );
    expect(await fetchStockLevel("nope")).toEqual({
      ok: false,
      message: 'No product found matching "nope".',
    });
  });

  it("lets non-404 errors propagate", async () => {
    vi.mocked(api.listProducts).mockResolvedValue([]);
    vi.mocked(api.getProduct).mockRejectedValue(new ApiError(500, "boom", null));
    await expect(fetchStockLevel("milk")).rejects.toThrow("boom");
  });
});

describe("weekly activity", () => {
  it("lastNDays returns n local dates ending today, oldest first", () => {
    expect(lastNDays(3, new Date(2026, 9, 14))).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
    ]);
    // Crosses a month boundary.
    expect(lastNDays(2, new Date(2026, 10, 1))).toEqual([
      "2026-10-31",
      "2026-11-01",
    ]);
  });

  it("fills missing days with zeros and totals the week", async () => {
    vi.mocked(api.listLogsByDay).mockResolvedValue([
      { date: "2026-10-12", count: 2, redo_count: 0, total_stock: 30 },
      { date: "2026-10-14", count: 1, redo_count: 0, total_stock: 8 },
    ]);

    const result = await fetchWeeklyActivity(new Date(2026, 9, 14));

    expect(api.listLogsByDay).toHaveBeenCalledWith({
      from: "2026-10-08",
      to: "2026-10-14",
    });
    expect(result.daily).toHaveLength(7);
    expect(result).toMatchObject({
      from: "2026-10-08",
      to: "2026-10-14",
      totalLogs: 3,
      totalUnitsLogged: 38,
      activeDays: 2,
    });
    expect(result.daily.find((d) => d.date === "2026-10-13")).toMatchObject({
      logs: 0,
      unitsLogged: 0,
    });
  });
});

describe("fetchProductHistory", () => {
  it("returns the newest entries first, capped at the limit", async () => {
    vi.mocked(api.listProducts).mockResolvedValue([product()]);
    vi.mocked(api.getProductLogHistory).mockResolvedValue([
      entry(1, "2026-10-10T09:00:00Z"),
      entry(2, "2026-10-12T09:00:00Z"),
      entry(3, "2026-10-11T09:00:00Z"),
    ]);

    const result = await fetchProductHistory("milk", 2);

    expect(api.getProductLogHistory).toHaveBeenCalledWith("milk");
    expect(result).toMatchObject({ ok: true, total: 3 });
    if (!result.ok) throw new Error("expected ok");
    expect(result.entries.map((e) => e.stock)).toEqual([2, 3]);
  });

  it("reports not-found when nothing matches", async () => {
    vi.mocked(api.listProducts).mockResolvedValue([]);
    vi.mocked(api.getProduct).mockRejectedValue(new ApiError(404, "x", null));
    expect(await fetchProductHistory("ghost")).toMatchObject({ ok: false });
  });
});

function entry(stock: number, loggedAt: string) {
  return {
    id: stock,
    logged_stock: stock,
    logged_at: loggedAt,
    storage_place: "fridge",
    storage_place_name: "Fridge",
    review_status: "approved",
    created_at: loggedAt,
  };
}
