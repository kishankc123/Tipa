"use client";

import { Grid2x2 } from "lucide-react";

import { ManagementList } from "@/components/management-list";
import { categories } from "@/lib/mock-data";

export default function CategoriesPage() {
  return (
    <ManagementList
      title="Category List"
      description="Manage your category"
      items={categories}
      icon={Grid2x2}
      searchPlaceholder="Search Category..."
      emptyTitle="No Categories Yet"
      emptyDescription="Add a category to get started."
    />
  );
}
