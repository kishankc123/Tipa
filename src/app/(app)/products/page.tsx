"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  MoreHorizontal,
  Package,
  Plus,
  Search,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listProducts, setProductActive, setProductPinned } from "@/lib/api";
import type { ApiProduct } from "@/lib/types";

export default function ProductsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listProducts()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => p.name.toLowerCase().includes(q));
  }, [items, query]);

  const handleToggleActive = async (product: ApiProduct) => {
    setUpdatingSlug(product.slug);
    try {
      const updated = await setProductActive(product.slug, !product.is_active);
      setItems((rows) =>
        rows.map((row) => (row.slug === updated.slug ? updated : row))
      );
    } finally {
      setUpdatingSlug(null);
    }
  };

  const handleTogglePinned = async (product: ApiProduct) => {
    setUpdatingSlug(product.slug);
    try {
      const updated = await setProductPinned(product.slug, !product.is_pinned);
      setItems((rows) =>
        rows.map((row) => (row.slug === updated.slug ? updated : row))
      );
    } finally {
      setUpdatingSlug(null);
    }
  };

  return (
    <>
      <SiteHeader title="Products" description="Manage your product catalog" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus />
                Add Product
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/products/new")}>
                <Package />
                Add Single Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/products/bulk")}>
                <FileSpreadsheet />
                Add Bulk Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-sm text-destructive"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No products found. Try a different search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => (
                    <TableRow
                      key={product.slug}
                      className="cursor-pointer"
                      onClick={() => router.push(`/products/${product.slug}`)}
                    >
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>{product.group_name ?? "—"}</TableCell>
                      <TableCell>{product.category_name ?? "—"}</TableCell>
                      <TableCell>{product.unit_name ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        Rs {Number(product.selling_price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(product.stock)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/products/${product.slug}/edit`)
                              }
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={updatingSlug === product.slug}
                              onClick={() => handleTogglePinned(product)}
                            >
                              {product.is_pinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            {!product.is_active ? (
                              <DropdownMenuItem
                                disabled={updatingSlug === product.slug}
                                onClick={() => handleToggleActive(product)}
                              >
                                Activate
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
