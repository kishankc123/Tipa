"use client";

import { useEffect, useState } from "react";
import { Box } from "lucide-react";

import { ManagementList } from "@/components/management-list";
import { SiteHeader } from "@/components/site-header";
import { createUnit, listUnits, toggleUnitStatus, updateUnit } from "@/lib/api";
import type { Unit } from "@/lib/types";

export default function UnitsPage() {
  const [items, setItems] = useState<Unit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listUnits()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load units");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <>
        <SiteHeader title="Units List" description="Manage your units" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-destructive">
          {error}
        </div>
      </>
    );
  }

  if (!items) {
    return (
      <>
        <SiteHeader title="Units List" description="Manage your units" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Loading units...
        </div>
      </>
    );
  }

  return (
    <ManagementList
      title="Units List"
      description="Manage your units"
      entityLabel="Unit"
      items={items}
      icon={Box}
      searchPlaceholder="Search Units..."
      emptyTitle="No Units Yet"
      emptyDescription="Add a unit to get started."
      createEntity={createUnit}
      updateEntity={updateUnit}
      toggleEntityStatus={toggleUnitStatus}
    />
  );
}
