"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";

import { ManagementList } from "@/components/management-list";
import { SiteHeader } from "@/components/site-header";
import { createGroup, listGroups, toggleGroupStatus, updateGroup } from "@/lib/api";
import type { Group } from "@/lib/types";

export default function GroupsPage() {
  const [items, setItems] = useState<Group[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listGroups()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load groups");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <>
        <SiteHeader title="Group List" description="Manage your group" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-destructive">
          {error}
        </div>
      </>
    );
  }

  if (!items) {
    return (
      <>
        <SiteHeader title="Group List" description="Manage your group" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Loading groups...
        </div>
      </>
    );
  }

  return (
    <ManagementList
      title="Group List"
      description="Manage your group"
      entityLabel="Group"
      items={items}
      icon={Layers}
      searchPlaceholder="Search Group..."
      emptyTitle="No Groups Yet"
      emptyDescription="Add a group to get started."
      createEntity={createGroup}
      updateEntity={updateGroup}
      toggleEntityStatus={toggleGroupStatus}
    />
  );
}
