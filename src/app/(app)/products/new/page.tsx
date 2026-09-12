"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  emptyProductFormValues,
  ProductForm,
  type ProductFormValues,
} from "@/components/product-form";
import { createInventoryLogEntry, createProduct } from "@/lib/api";

export default function AddProductPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ProductFormValues) => {
    setError(null);
    try {
      const product = await createProduct({
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

      if (values.trackInventory) {
        const rows = values.stockRows.filter(
          (row) => row.storagePlaceSlug && Number(row.quantity) > 0
        );
        await Promise.all(
          rows.map((row) =>
            createInventoryLogEntry(product.slug, {
              storagePlaceSlug: row.storagePlaceSlug,
              quantity: Number(row.quantity),
            })
          )
        );
      }

      router.push(`/products/${product.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product.");
    }
  };

  return (
    <>
      <SiteHeader
        title="Add Product"
        description="Add your Products"
        backHref="/products"
      />
      {error ? (
        <div className="mx-auto w-full max-w-2xl px-4 pt-4 md:px-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <ProductForm
        defaultValues={emptyProductFormValues}
        actionLabel="Add"
        actionIcon={Plus}
        onSubmit={handleSubmit}
      />
    </>
  );
}
