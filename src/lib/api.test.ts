import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { clearTokens, setTokens } from "@/lib/auth";

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

describe("named entity CRUD (groups/categories/units/store places, real API)", () => {
  beforeEach(() => {
    setTokens({ access: "test-access-token", refresh: "test-refresh-token" });
  });

  afterEach(() => {
    clearTokens();
    vi.unstubAllGlobals();
  });

  it("createGroup posts name + is_active and maps the slug back to id/status", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ name: "Dairy", slug: "dairy", is_active: true })
      );
    vi.stubGlobal("fetch", fetchMock);

    const group = await api.createGroup("Dairy");

    expect(group).toEqual({ id: "dairy", name: "Dairy", status: "active" });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/groups/`);
    expect(JSON.parse(options.body)).toEqual({ name: "Dairy", is_active: true });
  });

  it("createGroup honors an explicit inactive status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ name: "Dairy", slug: "dairy", is_active: false })
      )
    );

    const group = await api.createGroup("Dairy", "inactive");
    expect(group.status).toBe("inactive");
  });

  it("updateGroup PATCHes name and is_active", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ name: "Cold Storage", slug: "dairy", is_active: false })
      );
    vi.stubGlobal("fetch", fetchMock);

    const updated = await api.updateGroup("dairy", {
      name: "Cold Storage",
      status: "inactive",
    });

    expect(updated).toEqual({ id: "dairy", name: "Cold Storage", status: "inactive" });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/groups/dairy/`);
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({
      name: "Cold Storage",
      is_active: false,
    });
  });

  it("toggleGroupStatus reads current is_active then flips it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ name: "Dairy", slug: "dairy", is_active: true })
      )
      .mockResolvedValueOnce(
        jsonResponse({ name: "Dairy", slug: "dairy", is_active: false })
      );
    vi.stubGlobal("fetch", fetchMock);

    const toggled = await api.toggleGroupStatus("dairy");

    expect(toggled.status).toBe("inactive");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.method ?? "GET").toBe("GET");
    expect(fetchMock.mock.calls[1][1].method).toBe("PATCH");
  });

  it("createCategory sends both name and title", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ name: "Snacks", title: "Snacks", slug: "snacks", is_active: true })
    );
    vi.stubGlobal("fetch", fetchMock);

    const category = await api.createCategory("Snacks");

    expect(category).toEqual({ id: "snacks", name: "Snacks", status: "active" });
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      name: "Snacks",
      title: "Snacks",
      is_active: true,
    });
  });

  it("createUnit maps slug/name/is_active to id/name/status", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ name: "Kg", slug: "kg", is_active: true }))
    );

    const unit = await api.createUnit("Kg");
    expect(unit).toEqual({ id: "kg", name: "Kg", status: "active" });
  });

  it("createStorePlace maps slug/name/is_active to id/name/status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ name: "Fridge", slug: "fridge", is_active: true })
      )
    );

    const place = await api.createStorePlace("Fridge");
    expect(place).toEqual({ id: "fridge", name: "Fridge", status: "active" });
  });

  it("listGroups/listCategories/listUnits/listStorePlaces map paginated results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          count: 1,
          next: null,
          previous: null,
          results: [{ name: "Dairy", slug: "dairy", is_active: true }],
        })
      )
    );

    const groups = await api.listGroups();
    expect(groups).toEqual([{ id: "dairy", name: "Dairy", status: "active" }]);
  });
});

describe("team members (real API)", () => {
  beforeEach(() => {
    setTokens({ access: "test-access-token", refresh: "test-refresh-token" });
  });

  afterEach(() => {
    clearTokens();
    vi.unstubAllGlobals();
  });

  it("createTeamMember posts username/email/password/team_role", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ username: "jane", email: "jane@example.com", team_role: "member" })
    );
    vi.stubGlobal("fetch", fetchMock);

    const member = await api.createTeamMember({
      username: "jane",
      email: "jane@example.com",
      password: "supersecret1",
      role: "member",
    });

    expect(member.email).toBe("jane@example.com");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/team-members/`);
    expect(JSON.parse(options.body)).toEqual({
      username: "jane",
      email: "jane@example.com",
      password: "supersecret1",
      team_role: "member",
    });
  });

  it("listTeamMembers flattens the single Team response's team_members", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          owner: { username: "owner1", email: "o@example.com", business_name: null },
          team_members: [
            { id: 1, username: "jane", email: "jane@example.com", team_role: "member" },
          ],
        })
      )
    );

    const members = await api.listTeamMembers();
    expect(members).toHaveLength(1);
    expect(members[0].username).toBe("jane");
  });

  it("setTeamMemberActive PATCHes is_active by numeric id", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ id: 1, is_active: false }));
    vi.stubGlobal("fetch", fetchMock);

    const updated = await api.setTeamMemberActive(1, false);

    expect(updated.is_active).toBe(false);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/team-members/1/`);
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ is_active: false });
  });
});

describe("profile (real API)", () => {
  beforeEach(() => {
    setTokens({ access: "test-access-token", refresh: "test-refresh-token" });
  });

  afterEach(() => {
    clearTokens();
    vi.unstubAllGlobals();
  });

  it("getCurrentUser unwraps the whoami response's data field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ status: true, data: { email: "a@example.com", username: "a" } })
      )
    );

    const user = await api.getCurrentUser();
    expect(user.email).toBe("a@example.com");
  });

  it("updateProfile PATCHes profile fields and unwraps the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ status: true, data: { username: "kishan", email: "k@example.com" } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = await api.updateProfile({
      username: "kishan",
      contactNumber: "555-0100",
      businessName: "Tipa",
    });

    expect(user.username).toBe("kishan");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/auth/profile/`);
    expect(JSON.parse(options.body)).toEqual({
      username: "kishan",
      business_name: "Tipa",
      contact_number: "555-0100",
    });
  });

  it("changePassword posts current/new/confirm password fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ detail: "OK" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      api.changePassword({
        currentPassword: "old",
        newPassword: "new",
        confirmNewPassword: "new",
      })
    ).resolves.toEqual({ success: true });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/auth/profile/change-password/`);
    expect(JSON.parse(options.body)).toEqual({
      current_password: "old",
      new_password: "new",
      confirm_new_password: "new",
    });
  });
});

describe("dashboard, logs & reports (real API)", () => {
  beforeEach(() => {
    setTokens({ access: "test-access-token", refresh: "test-refresh-token" });
  });

  afterEach(() => {
    clearTokens();
    vi.unstubAllGlobals();
  });

  it("getDashboardData fetches the dashboard endpoint as-is", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        stats: { total_products: 1, total_logs: 1, total_pinned_products: 0, total_price_valuation: 100 },
        pinned_products: [],
        calendar_summary: { from_date: "2026-01-01", to_date: "2026-01-31", results: [] },
        qty_chart: { from_date: "2026-01-01", to_date: "2026-01-31", labels: [], values: [], total: 0 },
        recent_logs: [],
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const data = await api.getDashboardData();

    expect(data.stats.total_products).toBe(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_BASE_URL}/api/system/inventory-logs/dashboard/`
    );
  });

  it("listLogsByDay maps from/to to start_date/end_date query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ count: 1, next: null, previous: null, results: [{ date: "2026-01-01", count: 2, redo_count: 0, total_stock: 10 }] })
    );
    vi.stubGlobal("fetch", fetchMock);

    const rows = await api.listLogsByDay({ from: "2026-01-01", to: "2026-01-31" });

    expect(rows).toEqual([{ date: "2026-01-01", count: 2, redo_count: 0, total_stock: 10 }]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_BASE_URL}/api/system/inventory-logs/by-day/?start_date=2026-01-01&end_date=2026-01-31`
    );
  });

  it("getProductLogHistory queries by-product with the product slug", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ count: 1, next: null, previous: null, results: [{ id: 1, logged_stock: 5 }] })
    );
    vi.stubGlobal("fetch", fetchMock);

    const history = await api.getProductLogHistory("widget");

    expect(history).toEqual([{ id: 1, logged_stock: 5 }]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_BASE_URL}/api/system/inventory-logs/by-product/?product=widget`
    );
  });

  it("getValuationReport paginates and returns the response's total_value", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          count: 2,
          next: `${API_BASE_URL}/api/system/products/valuation-report/?page=2`,
          previous: null,
          results: [{ product_id: 1, product_name: "A" }],
          date: "2026-01-01",
          total_value: 500,
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          count: 2,
          next: null,
          previous: null,
          results: [{ product_id: 2, product_name: "B" }],
          date: "2026-01-01",
          total_value: 500,
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { rows, totalValue } = await api.getValuationReport();

    expect(rows.map((r) => r.product_name)).toEqual(["A", "B"]);
    expect(totalValue).toBe(500);
  });

  it("exportLogs posts from_date/to_date and resolves with a blob and filename", async () => {
    const fakeBlob = new Blob(["xlsx-bytes"]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => fakeBlob,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.exportLogs({ from: "2026-01-01", to: "2026-01-31" });

    expect(result.blob).toBe(fakeBlob);
    expect(result.filename).toBe("inventory-logs_2026-01-01_to_2026-01-31.xlsx");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/system/inventory-logs/export/`);
    expect(JSON.parse(options.body)).toEqual({
      from_date: "2026-01-01",
      to_date: "2026-01-31",
    });
  });

  it("exportLogs throws the server's error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: "Invalid date range." }),
      })
    );

    await expect(
      api.exportLogs({ from: "2026-01-31", to: "2026-01-01" })
    ).rejects.toThrow("Invalid date range.");
  });
});

describe("support", () => {
  it("submitContactMessage resolves with success", async () => {
    await expect(
      api.submitContactMessage({ subject: "Help", message: "It broke" })
    ).resolves.toEqual({ success: true });
  });
});
