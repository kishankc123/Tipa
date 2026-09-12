"use client";

import { useEffect, useState } from "react";
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
import { getValuationReport } from "@/lib/api";
import type { ApiValuationRow } from "@/lib/types";

export default function InventoryValuationPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ApiValuationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Show the loading state immediately when the query changes (before
    // the debounce timer fires), not just once the fetch itself starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const timeout = setTimeout(() => {
      getValuationReport(query || undefined)
        .then(({ rows: data, totalValue }) => {
          if (cancelled) return;
          setRows(data);
          setTotal(totalValue);
        })
        .catch((err) => {
          if (!cancelled)
            setError(err instanceof Error ? err.message : "Failed to load valuation report");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-sm text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <EmptyState
                        title="No products found"
                        description="Try a different product name."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.product_id}>
                      <TableCell className="font-medium">
                        {row.product_name}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.current_stock}
                      </TableCell>
                      <TableCell className="text-right">
                        Rs {row.rate.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        Rs {row.current_value.toFixed(2)}
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
              {rows.length} shown products
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
