"use client";

import { use } from "react";
import { useRouter } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ProductForm, type ProductFormValues } from "@/components/product-form";
import { products } from "@/lib/mock-data";

export default function EditProductPage({
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
        <SiteHeader title="Edit Product" backHref="/products" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-medium">Product not found</p>
          <Button variant="outline" onClick={() => router.push("/products")}>
            Back to Products
          </Button>
        </div>
      </>
    );
  }

  const defaultValues: ProductFormValues = {
    name: product.name,
    groupId: product.groupId ?? "",
    categoryId: product.categoryId ?? "",
    unitId: product.unitId ?? "",
    price: product.price.toFixed(2),
    active: product.active,
    pinned: product.pinned,
    description: product.description ?? "",
    trackInventory: true,
    stockRows: product.storeStock.map((entry) => ({
      storePlaceId: entry.storePlaceId,
      quantity: String(entry.quantity),
    })),
  };

  const handleSubmit = () => {
    router.push(`/products/${id}`);
  };

  return (
    <>
      <SiteHeader
        title="Edit Product"
        description="Update product details"
        backHref={`/products/${id}`}
      />
      <ProductForm
        defaultValues={defaultValues}
        actionLabel="Update"
        onSubmit={handleSubmit}
      />
    </>
  );
}
