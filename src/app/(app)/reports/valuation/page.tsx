"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { products } from "@/lib/mock-data";

export default function InventoryValuationPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  const total = filtered.reduce((sum, p) => sum + p.price * p.stock, 0);

  return (
    <>
      <SiteHeader title="Inventory Valuation" description="Reports" />
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

        <Card className="flex-1">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Detail</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <EmptyState
                        title="No products found"
                        description="Try a different product name."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.stock}
                      </TableCell>
                      <TableCell className="text-right">
                        Rs {product.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        Rs {(product.price * product.stock).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Total Valuation
            </p>
            <p className="text-xs text-muted-foreground">
              {filtered.length} shown products
            </p>
          </div>
          <div className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">
            Rs {total.toFixed(2)}
          </div>
        </div>
      </div>
    </>
  );
}
