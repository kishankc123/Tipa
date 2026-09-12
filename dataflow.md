# Data Flow

How data moves between the UI and the real IMS API, and which parts of the
app still run on mock data. Scope of the real integration so far: **auth +
products only** (see the table at the bottom).

## Layers

```
Page component                    e.g. src/app/(app)/products/page.tsx
      │  calls
      ▼
api.ts functions                  src/lib/api.ts
      │  calls
      ▼
apiFetch()                        src/lib/api-client.ts
      │  fetch(`${API_BASE_URL}${path}`, ...)
      ▼
Same-origin request to /api/system/...
      │
      ▼
Route Handler (proxy)             src/app/api/system/[...path]/route.ts
      │  server-to-server fetch()
      ▼
Real backend                      https://ims-v2.codex.com.np
```

Each layer only talks to the one directly below it. A page never calls
`fetch` itself, and `api.ts` never touches `localStorage` or headers
directly — that's what makes it possible to swap the backend, add retry
logic, or change auth storage in one place.

### 1. Config — [src/lib/config.ts](src/lib/config.ts)

Exports `API_BASE_URL`, which is `""` (empty string, meaning "same
origin"). Every URL built anywhere in the app starts from this constant.
Leave it empty to go through the proxy (below); set
`NEXT_PUBLIC_API_BASE_URL` to call the real host directly from a context
where CORS doesn't apply (e.g. a server-only script).

### 2. Auth — [src/lib/auth.ts](src/lib/auth.ts)

The only file that touches the JWT tokens directly.

- `login(emailOrUsername, password)` — `POST /api/system/auth/login/`,
  stores the returned `access`/`refresh` tokens in `localStorage`.
- `logout()` — `GET /api/system/auth/logout/`, clears stored tokens.
- `getAccessToken()` / `isAuthenticated()` — read back from `localStorage`.

Consumed by:
- [src/app/login/page.tsx](src/app/login/page.tsx) — the login form.
- [src/components/auth-guard.tsx](src/components/auth-guard.tsx) — wraps
  every page under `(app)` (see
  [src/app/(app)/layout.tsx](src/app/(app)/layout.tsx)); redirects to
  `/login` if `isAuthenticated()` is false.
- [src/components/app-sidebar.tsx](src/components/app-sidebar.tsx) — the
  "Log Out" button.
- [src/lib/api-client.ts](src/lib/api-client.ts) — reads the token to
  attach it to every request.

### 3. API client — [src/lib/api-client.ts](src/lib/api-client.ts)

One function, `apiFetch<T>(path, options)`, that every real API call goes
through. It:

- prepends `API_BASE_URL` to `path`
- attaches `Authorization: Bearer <token>` automatically
- parses the JSON response and throws a typed `ApiError` carrying the
  backend's actual error message on a non-2xx response
- on a `401`, clears tokens and redirects to `/login` (this API has no
  refresh-token endpoint, so there's no silent retry — just a fresh login)

### 4. API functions — [src/lib/api.ts](src/lib/api.ts)

One function per endpoint, each a thin wrapper around `apiFetch`. This is
the translation layer between what the UI wants (camelCase fields, plain
numbers) and what the backend wants (snake_case, decimal strings, slugs
instead of ids) — see `toProductRequestBody()` for an example.

Real-API functions in this file: `listProducts`, `getProduct`,
`createProduct`, `updateProduct`, `setProductActive`, `setProductPinned`,
`deleteProduct`, `createInventoryLogEntry`, `bulkImportProducts`,
`listApiGroups`, `listApiCategories`, `listApiUnits`,
`listApiStoragePlaces`.

Everything else in this file (`createGroup`, `createCategory`,
`createTeamMember`, `updateProfile`, `exportLogs`, etc.) still operates on
the in-memory arrays in
[src/lib/mock-data.ts](src/lib/mock-data.ts) — no network call.

### 5. The proxy — [src/app/api/system/\[...path\]/route.ts](src/app/api/system/[...path]/route.ts)

Every `/api/system/*` request from the browser lands here first. It makes
its own `fetch()` to `https://ims-v2.codex.com.np/api/system/...` and
streams the response back. Two backend problems make this necessary
instead of a direct browser→backend call:

1. **No CORS headers.** The real API never sends
   `Access-Control-Allow-Origin`, so the browser blocks a direct
   cross-origin request outright.
2. **Django's CSRF Origin check.** A plain Next.js `rewrites()`
   passthrough looks like a fix, but it forwards the browser's `Origin`
   header along with the request — Django's CSRF middleware then rejects
   it with a 403 ("Origin checking failed"), which looks unrelated to CORS
   if you don't know to look for it.

Because the route handler issues its own server-side request, the backend
only ever sees the Next.js server as the caller, never the browser's
origin — sidestepping both.

### 6. Types — [src/lib/types.ts](src/lib/types.ts)

Real-API shapes are prefixed `Api*` (`ApiProduct`, `ApiGroup`,
`ApiCategory`, `ApiUnit`, `ApiStoragePlace`, `ApiProductStorage`,
`PaginatedResponse<T>`) and kept separate from the original mock types
(`Product`, `Group`, `Category`, ...) so the still-mock pages
(dashboard, reports, group/category/unit/storeplace management) didn't
need to change.

## Sequence: logging in

```
LoginPage (src/app/login/page.tsx)
  → auth.login(email, password)
      → fetch POST /api/system/auth/login/          [same origin]
          → route.ts proxies to real backend
              → backend validates, returns {tokens, user}
      → tokens stored in localStorage
  → router.push("/dashboard")
      → AuthGuard sees isAuthenticated() === true → renders the page
```

## Sequence: loading the products list

```
ProductsPage (src/app/(app)/products/page.tsx)
  useEffect → api.listProducts()
    → apiFetch("/api/system/products/")
        → Authorization header attached from auth.ts
        → same-origin GET to route.ts
            → route.ts fetches https://ims-v2.codex.com.np/api/system/products/
            → backend returns { count, next, previous, results }
        → listProducts() follows `next` until exhausted, returns ApiProduct[]
  → setItems(data) → table renders
```

## Sequence: creating a product with initial stock

```
AddProductPage (src/app/(app)/products/new/page.tsx)
  ProductForm collects: name, group/category/unit slugs, cost/selling price,
  stock rows (storage place slug + quantity)
  onSubmit:
    1. api.createProduct(...)        → POST /api/system/products/
    2. for each filled stock row:
       api.createInventoryLogEntry() → POST /api/system/inventory-logs/
       (Product.stock is read-only — the backend derives it from logs,
        not from the create payload)
    3. router.push(`/products/${product.slug}`)
```

## What's real vs. mock, right now

| Area | Status | Files |
|---|---|---|
| Auth (login/logout/guard) | **Real API** | `src/lib/auth.ts`, `src/app/login/`, `src/components/auth-guard.tsx` |
| Products (list/create/edit/delete/pin/activate/bulk) | **Real API** | `src/app/(app)/products/*`, `src/components/product-form.tsx` |
| Group/Category/Unit/Storage-Place *lookups* (for the product form's dropdowns) | **Real API**, read-only | `listApiGroups` etc. in `src/lib/api.ts` |
| Group/Category/Unit/Storage-Place *management pages* (create/edit/toggle) | Mock data | `src/app/(app)/{group,category,units,storeplace}-management/`, `src/components/management-list.tsx` |
| Team Members | Mock data | `src/app/(app)/team-members/page.tsx` |
| Profile / Edit Profile | Mock data (hardcoded placeholder values, not even wired to mock-data) | `src/app/(app)/profile/page.tsx`, `src/app/(app)/edit-profile/page.tsx` |
| Dashboard, Reports, Logs | Mock data | `src/app/(app)/dashboard/`, `src/app/(app)/reports/`, `src/app/(app)/logs/` |

Because the lookup dropdowns in the product form hit the real API but the
management pages for those same entities (Group/Category/Unit/Storage
Place) still edit mock data, **groups/categories/units/storage-places you
create in those management pages won't show up in the product form**, and
vice versa. They're two different data sources until those pages are
migrated too.

## Real-API quirks discovered by testing (not from the spec)

The OpenAPI spec at `/schema/` isn't fully accurate — these were found by
making real requests, not by reading docs:

- `category` and `unit` are required on product create/update, even
  though the spec marks them nullable/optional.
- `POST /products/{slug}/activate/` unconditionally sets `is_active:
  true` and ignores the request body — there is no working "deactivate"
  action for products; only `DELETE` removes a product, and only when it
  has no log/order/cart history (`409 Conflict` otherwise, see
  `src/app/(app)/products/[id]/page.tsx`'s delete error handling).
- The API has no refresh-token endpoint, so a `401` just clears tokens
  and sends the user back to `/login` — no silent token refresh.

## Extending this pattern to another resource

1. Read the real request/response shape at `https://ims-v2.codex.com.np/schema/`
   — then verify required fields with an actual request; don't trust the
   spec's "required" list.
2. Add `Api*` types to `src/lib/types.ts`.
3. Add functions to `src/lib/api.ts` wrapping `apiFetch` (copy
   `listApiGroups`/`createProduct`/`updateProduct`).
4. No new proxy route needed — the catch-all at
   `src/app/api/system/[...path]/route.ts` already forwards any
   `/api/system/*` path.
5. Swap the page's `mock-data` import for the new `api.ts` functions, add
   `loading`/`error` state and a `useEffect` fetch (see
   `src/app/(app)/products/page.tsx` for the pattern).
6. Add tests to `src/lib/api.test.ts` by stubbing `global.fetch` with
   `vi.stubGlobal("fetch", ...)` and asserting on the URL/method/body —
   don't assert against mutated mock arrays like the old tests did.
