"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProductLogHistory, listProducts } from "@/lib/api";
import type { ApiProduct, ApiProductLogEntry } from "@/lib/types";

export default function ProductWiseReportPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState("");

  const [history, setHistory] = useState<ApiProductLogEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listProducts()
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        if (data.length > 0) setSelectedSlug(data[0].slug);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSlug) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistory([]);
      return;
    }
    let cancelled = false;
    setLoadingHistory(true);
    getProductLogHistory(selectedSlug)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load product history");
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const selected = products.find((p) => p.slug === selectedSlug);

  return (
    <>
      <SiteHeader title="Product Wise Report" description="Reports" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search Product..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loadingProducts ? (
          <p className="text-sm text-muted-foreground">Loading products...</p>
        ) : error && products.length === 0 ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((product) => (
              <button
                key={product.slug}
                onClick={() => setSelectedSlug(product.slug)}
                className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                  selectedSlug === product.slug ? "border-primary bg-accent" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-primary">
                    Rs {Number(product.selling_price || 0).toFixed(2)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Total Stock {Number(product.stock)}
                </span>
              </button>
            ))}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="border-b px-4 py-3 text-sm font-medium">
              Product History{selected ? ` — ${selected.name}` : ""}
            </div>
            {loadingHistory ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Loading history...
              </p>
            ) : history.length === 0 ? (
              <EmptyState
                title="No history yet"
                description="Stock logs for this product will show up here."
              />
            ) : (
              <div className="divide-y">
                {history.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm">
                      {log.created_at.slice(0, 10)} · {log.storage_place_name}
                    </span>
                    <span className="text-sm font-medium">{log.logged_stock}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
