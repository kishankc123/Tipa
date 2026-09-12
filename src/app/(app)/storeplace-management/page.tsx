"use client";

import { Store } from "lucide-react";

import { ManagementList } from "@/components/management-list";
import {
  createStorePlace,
  toggleStorePlaceStatus,
  updateStorePlace,
} from "@/lib/api";
import { storePlaces } from "@/lib/mock-data";

export default function StorePlacesPage() {
  return (
    <ManagementList
      title="Storeplace List"
      description="Manage your storeplace"
      entityLabel="Store Place"
      items={storePlaces}
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
