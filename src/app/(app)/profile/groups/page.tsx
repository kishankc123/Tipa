"use client";

import { Layers } from "lucide-react";

import { ManagementList } from "@/components/management-list";
import { groups } from "@/lib/mock-data";

export default function GroupsPage() {
  return (
    <ManagementList
      title="Group List"
      description="Manage your group"
      items={groups}
      icon={Layers}
      searchPlaceholder="Search Group..."
      emptyTitle="No Groups Yet"
      emptyDescription="Add a group to get started."
    />
  );
}
