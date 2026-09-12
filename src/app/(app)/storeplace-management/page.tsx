"use client";

import { useEffect, useState } from "react";
import { Store } from "lucide-react";

import { ManagementList } from "@/components/management-list";
import { SiteHeader } from "@/components/site-header";
import {
  createStorePlace,
  listStorePlaces,
  toggleStorePlaceStatus,
  updateStorePlace,
} from "@/lib/api";
import type { StorePlace } from "@/lib/types";

export default function StorePlacesPage() {
  const [items, setItems] = useState<StorePlace[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listStorePlaces()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load store places");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <>
        <SiteHeader title="Storeplace List" description="Manage your storeplace" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-destructive">
          {error}
        </div>
      </>
    );
  }

  if (!items) {
    return (
      <>
        <SiteHeader title="Storeplace List" description="Manage your storeplace" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Loading store places...
        </div>
      </>
    );
  }

  return (
    <ManagementList
      title="Storeplace List"
      description="Manage your storeplace"
      entityLabel="Store Place"
      items={items}
      icon={Store}
      searchPlaceholder="Search Store place..."
      emptyTitle="No Store Places Yet"
      emptyDescription="Add a store place to get started."
      createEntity={createStorePlace}
      updateEntity={updateStorePlace}
      toggleEntityStatus={toggleStorePlaceStatus}
    />
  );
}
