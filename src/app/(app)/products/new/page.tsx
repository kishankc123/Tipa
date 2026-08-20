"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import {
  emptyProductFormValues,
  ProductForm,
} from "@/components/product-form";

export default function AddProductPage() {
  const router = useRouter();

  const handleSubmit = () => {
    router.push("/products");
  };

  return (
    <>
      <SiteHeader
        title="Add Product"
        description="Add your Products"
        backHref="/products"
      />
      <ProductForm
        defaultValues={emptyProductFormValues}
        actionLabel="Add"
        actionIcon={Plus}
        onSubmit={handleSubmit}
      />
    </>
  );
}
