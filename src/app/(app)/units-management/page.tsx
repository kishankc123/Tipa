"use client";

import { Box } from "lucide-react";

import { ManagementList } from "@/components/management-list";
import { units } from "@/lib/mock-data";

export default function UnitsPage() {
  return (
    <ManagementList
      title="Units List"
      description="Manage your units"
      entityLabel="Unit"
      items={units}
      icon={Box}
      searchPlaceholder="Search Units..."
      emptyTitle="No Units Yet"
      emptyDescription="Add a unit to get started."
    />
  );
}
