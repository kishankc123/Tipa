"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Pin, SquarePen, Store, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteProduct, getProduct, setProductPinned } from "@/lib/api";
import type { ApiProduct } from "@/lib/types";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pinning, setPinning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProduct(slug)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(slug);
      router.push("/products");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePin = async () => {
    if (!product) return;
    setPinning(true);
    try {
      const updated = await setProductPinned(product.slug, !product.is_pinned);
      setProduct(updated);
    } finally {
      setPinning(false);
    }
  };

  if (loading) {
    return (
      <>
        <SiteHeader title="Product Detail" backHref="/products" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Loading product...
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <SiteHeader title="Product Detail" backHref="/products" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-medium">{error ?? "Product not found"}</p>
          <Button variant="outline" onClick={() => router.push("/products")}>
            Back to Products
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader title="Product Detail" backHref="/products" />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
        <Card className="overflow-hidden py-0">
          <div className="flex aspect-video items-center justify-center bg-muted">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                className="size-full object-cover"
              />
            ) : (
              <Package className="size-16 text-muted-foreground/40" />
            )}
          </div>
          <CardContent className="space-y-4 pt-4 pb-6">
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <button
                type="button"
                onClick={handleTogglePin}
                disabled={pinning}
                aria-label={product.is_pinned ? "Unpin product" : "Pin product"}
              >
                <Pin
                  className={
                    product.is_pinned
                      ? "size-5 fill-muted-foreground text-muted-foreground"
                      : "size-5 text-muted-foreground"
                  }
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-primary/15 p-3">
                <p className="text-xs text-muted-foreground">Stock</p>
                <p className="text-xl font-bold">{Number(product.stock)}</p>
              </div>
              <div className="rounded-lg bg-primary/15 p-3">
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="text-xl font-bold">
                  Rs {Number(product.selling_price || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <Button className="w-full" asChild>
              <Link href={`/products/${product.slug}/edit`}>
                <SquarePen />
                Edit Details
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Product Details</h3>
          <Card>
            <CardContent className="divide-y p-0">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Group</span>
                <span className="text-sm font-medium">
                  {product.group_name ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium">
                  {product.category_name ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Units</span>
                <span className="text-sm font-medium">
                  {product.unit_name ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Cost Price</span>
                <span className="text-sm font-medium">
                  Rs {Number(product.cost_price || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Storage Breakdown</h3>
          <Card>
            <CardContent className="divide-y p-0">
              {product.stock_levels.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No storage locations assigned yet.
                </p>
              ) : (
                product.stock_levels.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Store className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {entry.storage_place_name}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {entry.stock} Units
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {deleteError ? (
          <Alert variant="destructive">
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 />
              Delete Product
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this product?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove &ldquo;{product.name}&rdquo; and
                its stock records. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
