"use client";

import { useEffect, useState } from "react";
import { Grid2x2 } from "lucide-react";

import { ManagementList } from "@/components/management-list";
import { SiteHeader } from "@/components/site-header";
import {
  createCategory,
  listCategories,
  toggleCategoryStatus,
  updateCategory,
} from "@/lib/api";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load categories");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <>
        <SiteHeader title="Category List" description="Manage your category" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-destructive">
          {error}
        </div>
      </>
    );
  }

  if (!items) {
    return (
      <>
        <SiteHeader title="Category List" description="Manage your category" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Loading categories...
        </div>
      </>
    );
  }

  return (
    <ManagementList
      title="Category List"
      description="Manage your category"
      entityLabel="Category"
      items={items}
      icon={Grid2x2}
      searchPlaceholder="Search Category..."
      emptyTitle="No Categories Yet"
      emptyDescription="Add a category to get started."
      createEntity={createCategory}
      updateEntity={updateCategory}
      toggleEntityStatus={toggleCategoryStatus}
    />
  );
}
