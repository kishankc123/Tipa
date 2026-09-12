import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Each import of "@/lib/mock-data" returns the same in-memory arrays that
// api.ts mutates. Resetting modules between tests would just re-import the
// same seed data anyway (mock-data.ts has no reset hook), so instead we
// keep module state and assert against unique, per-test entity names to
// avoid cross-test interference.

import * as api from "@/lib/api";
import { categories, groups, storePlaces, units } from "@/lib/mock-data";
import { API_BASE_URL } from "@/lib/config";
import { clearTokens, setTokens } from "@/lib/auth";

function uniqueName(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

// The product/group/category/unit/storage-place read paths in api.ts now
// hit the real IMS API via apiFetch (see src/lib/api-client.ts), so these
// tests stub global.fetch instead of asserting against mutated arrays.
describe("products (real API)", () => {
  beforeEach(() => {
    setTokens({ access: "test-access-token", refresh: "test-refresh-token" });
  });

  afterEach(() => {
    clearTokens();
    vi.unstubAllGlobals();
  });

  it("createProduct posts to /api/system/products/ with an Authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ name: "Widget", slug: "widget", is_active: true })
    );
    vi.stubGlobal("fetch", fetchMock);

    const product = await api.createProduct({
      name: "Widget",
      group: "grp-slug",
      costPrice: 10,
      sellingPrice: 15,
      isActive: true,
      isPinned: false,
    });

    expect(product.slug).toBe("widget");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/products/`);
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer test-access-token");
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      name: "Widget",
      group: "grp-slug",
      cost_price: "10",
      selling_price: "15",
      is_active: true,
      is_pinned: false,
    });
  });

  it("updateProduct sends a PATCH to the product's slug", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ slug: "widget", selling_price: "25" }));
    vi.stubGlobal("fetch", fetchMock);

    const updated = await api.updateProduct("widget", { sellingPrice: 25 });

    expect(updated.selling_price).toBe("25");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/products/widget/`);
    expect(options.method).toBe("PATCH");
  });

  it("throws an ApiError with the server's message on a failed request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "Product not found." }, 404))
    );

    await expect(api.updateProduct("does-not-exist", { sellingPrice: 1 })).rejects.toThrow(
      "Product not found."
    );
  });

  it("setProductActive posts to the activate endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ slug: "widget", is_active: false }));
    vi.stubGlobal("fetch", fetchMock);

    const deactivated = await api.setProductActive("widget", false);

    expect(deactivated.is_active).toBe(false);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/products/widget/activate/`);
    expect(JSON.parse(options.body)).toEqual({ is_active: false });
  });

  it("setProductPinned posts to the pin endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ slug: "widget", is_pinned: true }));
    vi.stubGlobal("fetch", fetchMock);

    const pinned = await api.setProductPinned("widget", true);

    expect(pinned.is_pinned).toBe(true);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/products/widget/pin/`);
    expect(JSON.parse(options.body)).toEqual({ is_pinned: true });
  });

  it("deleteProduct sends a DELETE to the product's slug", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, 204));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.deleteProduct("widget")).resolves.toBeUndefined();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/products/widget/`);
    expect(options.method).toBe("DELETE");
  });

  it("listProducts follows pagination via the `next` link", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          count: 2,
          next: `${API_BASE_URL}/api/system/products/?page=2`,
          previous: null,
          results: [{ slug: "a", name: "A" }],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          count: 2,
          next: null,
          previous: null,
          results: [{ slug: "b", name: "B" }],
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const all = await api.listProducts();

    expect(all.map((p) => p.slug)).toEqual(["a", "b"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("createInventoryLogEntry posts product, storage place and quantity", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await api.createInventoryLogEntry("widget", {
      storagePlaceSlug: "fridge",
      quantity: 5,
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/inventory-logs/`);
    expect(JSON.parse(options.body)).toEqual({
      product: "widget",
      storage_place: "fridge",
      logged_stock: 5,
    });
  });

  it("bulkImportProducts uploads the file as multipart form data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["a,b,c"], "products.csv", { type: "text/csv" });

    const result = await api.bulkImportProducts(file);

    expect(result.fileName).toBe("products.csv");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/products/bulk-upload/`);
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.headers["Content-Type"]).toBeUndefined();
  });

  it("listApiGroups/Categories/Units/StoragePlaces fetch from their real endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ count: 0, next: null, previous: null, results: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await api.listApiGroups();
    await api.listApiCategories();
    await api.listApiUnits();
    await api.listApiStoragePlaces();

    const calledUrls = fetchMock.mock.calls.map((c) => c[0]);
    expect(calledUrls).toEqual([
      `${API_BASE_URL}/api/system/groups/`,
      `${API_BASE_URL}/api/system/categories/`,
      `${API_BASE_URL}/api/system/units/`,
      `${API_BASE_URL}/api/system/storage-places/`,
    ]);
  });
});

describe("named entity CRUD (groups/categories/units/store places)", () => {
  it("createGroup defaults to active status when omitted", async () => {
    const name = uniqueName("Group");
    const group = await api.createGroup(name);

    expect(group.name).toBe(name);
    expect(group.status).toBe("active");
    expect(groups.find((g) => g.id === group.id)).toEqual(group);
  });

  it("createGroup honors an explicit status", async () => {
    const group = await api.createGroup(uniqueName("Group"), "inactive");
    expect(group.status).toBe("inactive");
  });

  it("updateGroup patches name and status", async () => {
    const group = await api.createGroup(uniqueName("Group"));
    const renamed = uniqueName("Renamed");

    const updated = await api.updateGroup(group.id, { name: renamed, status: "inactive" });

    expect(updated.name).toBe(renamed);
    expect(updated.status).toBe("inactive");
  });

  it("updateGroup throws for an unknown id", async () => {
    await expect(api.updateGroup("nope", { name: "x" })).rejects.toThrow(/not found/i);
  });

  it("toggleGroupStatus flips active <-> inactive", async () => {
    const group = await api.createGroup(uniqueName("Group"), "active");

    const toggled = await api.toggleGroupStatus(group.id);
    expect(toggled.status).toBe("inactive");

    const toggledAgain = await api.toggleGroupStatus(group.id);
    expect(toggledAgain.status).toBe("active");
  });

  it("toggleGroupStatus throws for an unknown id", async () => {
    await expect(api.toggleGroupStatus("nope")).rejects.toThrow(/not found/i);
  });

  it("createCategory / updateCategory / toggleCategoryStatus behave the same way", async () => {
    const category = await api.createCategory(uniqueName("Category"));
    expect(category.status).toBe("active");

    const updated = await api.updateCategory(category.id, { name: "Renamed" });
    expect(updated.name).toBe("Renamed");

    const toggled = await api.toggleCategoryStatus(category.id);
    expect(toggled.status).toBe("inactive");
    expect(categories.find((c) => c.id === category.id)?.status).toBe("inactive");
  });

  it("createUnit / updateUnit / toggleUnitStatus behave the same way", async () => {
    const unit = await api.createUnit(uniqueName("Unit"));
    expect(unit.status).toBe("active");

    const updated = await api.updateUnit(unit.id, { name: "kg" });
    expect(updated.name).toBe("kg");

    const toggled = await api.toggleUnitStatus(unit.id);
    expect(toggled.status).toBe("inactive");
    expect(units.find((u) => u.id === unit.id)?.status).toBe("inactive");
  });

  it("createStorePlace / updateStorePlace / toggleStorePlaceStatus behave the same way", async () => {
    const place = await api.createStorePlace(uniqueName("Shelf"));
    expect(place.status).toBe("active");

    const updated = await api.updateStorePlace(place.id, { name: "Back room" });
    expect(updated.name).toBe("Back room");

    const toggled = await api.toggleStorePlaceStatus(place.id);
    expect(toggled.status).toBe("inactive");
    expect(storePlaces.find((s) => s.id === place.id)?.status).toBe("inactive");
  });
});

describe("team members", () => {
  it("createTeamMember always starts as active regardless of input", async () => {
    const member = await api.createTeamMember({
      name: "Jane Doe",
      email: "jane@example.com",
      role: "staff",
    });

    expect(member.status).toBe("active");
    expect(member.id).toBeTruthy();
    expect(member.email).toBe("jane@example.com");
  });
});

describe("profile", () => {
  it("updateProfile resolves with the same values it was given", async () => {
    const input = {
      username: "kishan",
      contactNumber: "555-0100",
      companyName: "Tipa",
    };
    await expect(api.updateProfile(input)).resolves.toEqual(input);
  });

  it("changePassword resolves with success without validating the input", async () => {
    await expect(
      api.changePassword({ currentPassword: "old", newPassword: "new" })
    ).resolves.toEqual({ success: true });
  });
});

describe("logs", () => {
  it("exportLogs resolves with a download url and the current log count", async () => {
    const result = await api.exportLogs({ from: "2026-01-01", to: "2026-01-31" });
    expect(result.url).toBe("/api/logs/export/download");
    expect(typeof result.count).toBe("number");
  });
});

describe("support", () => {
  it("submitContactMessage resolves with success", async () => {
    await expect(
      api.submitContactMessage({ subject: "Help", message: "It broke" })
    ).resolves.toEqual({ success: true });
  });
});
