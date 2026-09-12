"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProductForm, type ProductFormValues } from "@/components/product-form";
import { getProduct, updateProduct } from "@/lib/api";
import type { ApiProduct } from "@/lib/types";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <>
        <SiteHeader title="Edit Product" backHref="/products" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Loading product...
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <SiteHeader title="Edit Product" backHref="/products" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-medium">{error ?? "Product not found"}</p>
          <Button variant="outline" onClick={() => router.push("/products")}>
            Back to Products
          </Button>
        </div>
      </>
    );
  }

  const defaultValues: ProductFormValues = {
    name: product.name,
    groupSlug: product.group ?? "",
    categorySlug: product.category ?? "",
    unitSlug: product.unit ?? "",
    costPrice: product.cost_price ?? "",
    sellingPrice: product.selling_price ?? "",
    active: product.is_active,
    pinned: product.is_pinned,
    description: product.description ?? "",
    trackInventory: product.stock_levels.length > 0,
    stockRows:
      product.stock_levels.length > 0
        ? product.stock_levels.map((entry) => ({
            storagePlaceSlug: entry.storage_place ?? "",
            quantity: String(entry.stock),
          }))
        : [{ storagePlaceSlug: "", quantity: "" }],
  };

  const handleSubmit = async (values: ProductFormValues) => {
    setError(null);
    try {
      await updateProduct(slug, {
        name: values.name,
        group: values.groupSlug,
        category: values.categorySlug || undefined,
        unit: values.unitSlug || undefined,
        costPrice: Number(values.costPrice) || 0,
        sellingPrice: Number(values.sellingPrice) || 0,
        isActive: values.active,
        isPinned: values.pinned,
        description: values.description || undefined,
      });
      router.push(`/products/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product.");
    }
  };

  return (
    <>
      <SiteHeader
        title="Edit Product"
        description="Update product details"
        backHref={`/products/${slug}`}
      />
      {error ? (
        <div className="mx-auto w-full max-w-2xl px-4 pt-4 md:px-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <ProductForm
        defaultValues={defaultValues}
        actionLabel="Update"
        onSubmit={handleSubmit}
      />
    </>
  );
}
