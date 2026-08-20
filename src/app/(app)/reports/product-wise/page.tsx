"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { inventoryLogs, products } from "@/lib/mock-data";

export default function ProductWiseReportPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  const selected = products.find((p) => p.id === selectedId);
  const history = inventoryLogs.filter((l) => l.productId === selectedId);

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

        <div className="flex flex-col gap-2">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => setSelectedId(product.id)}
              className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                selectedId === product.id ? "border-primary bg-accent" : ""
              }`}
            >
              <div>
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-primary">
                  Rs {product.price.toFixed(2)}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                Total Stock {product.stock}
              </span>
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="border-b px-4 py-3 text-sm font-medium">
              Product History{selected ? ` — ${selected.name}` : ""}
            </div>
            {history.length === 0 ? (
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
                    <span className="text-sm">{log.date}</span>
                    <span className="text-sm font-medium">{log.change}</span>
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
