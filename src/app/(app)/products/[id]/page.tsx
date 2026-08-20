"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Package, Pin, SquarePen, Store, Trash2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  categories,
  products,
  storePlaces,
  units,
} from "@/lib/mock-data";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <>
        <SiteHeader title="Product Detail" backHref="/products" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-medium">Product not found</p>
          <Button variant="outline" onClick={() => router.push("/products")}>
            Back to Products
          </Button>
        </div>
      </>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const unit = units.find((u) => u.id === product.unitId);

  return (
    <>
      <SiteHeader title="Product Detail" backHref="/products" />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
        <Card className="overflow-hidden py-0">
          <div className="flex aspect-video items-center justify-center bg-muted">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
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
              {product.pinned ? (
                <Pin className="size-5 fill-muted-foreground text-muted-foreground" />
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-primary/15 p-3">
                <p className="text-xs text-muted-foreground">Stock</p>
                <p className="text-xl font-bold">{product.stock}</p>
              </div>
              <div className="rounded-lg bg-primary/15 p-3">
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="text-xl font-bold">
                  Rs {product.price % 1 === 0 ? product.price : product.price.toFixed(2)}
                </p>
              </div>
            </div>

            <Button className="w-full">
              <SquarePen />
              Edit Details
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Product Details</h3>
          <Card>
            <CardContent className="divide-y p-0">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium">
                  {category?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Units</span>
                <span className="text-sm font-medium">{unit?.name ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={product.active ? "default" : "secondary"}>
                  {product.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Storage Breakdown</h3>
          <Card>
            <CardContent className="divide-y p-0">
              {product.storeStock.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No storage locations assigned yet.
                </p>
              ) : (
                product.storeStock.map((entry) => {
                  const place = storePlaces.find(
                    (s) => s.id === entry.storePlaceId
                  );
                  return (
                    <div
                      key={entry.storePlaceId}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <Store className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {place?.name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {place?.name.toLowerCase() ?? ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {entry.quantity} Units
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <Button variant="destructive" className="w-full">
          <Trash2 />
          Delete Product
        </Button>
      </div>
    </>
  );
}
