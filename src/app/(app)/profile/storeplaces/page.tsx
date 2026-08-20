"use client";

import { Store } from "lucide-react";

import { ManagementList } from "@/components/management-list";
import { storePlaces } from "@/lib/mock-data";

export default function StorePlacesPage() {
  return (
    <ManagementList
      title="Storeplace List"
      description="Manage your storeplace"
      items={storePlaces}
      icon={Store}
      searchPlaceholder="Search Store place..."
      emptyTitle="No Store Places Yet"
      emptyDescription="Add a store place to get started."
    />
  );
}
