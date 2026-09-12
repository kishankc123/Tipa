"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { MoreVertical, Plus, Search } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { EntityStatus } from "@/lib/types";

interface NamedEntity {
  id: string;
  name: string;
  status: EntityStatus;
}

export function ManagementList<T extends NamedEntity>({
  title,
  description,
  entityLabel,
  items,
  icon: Icon,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  createEntity,
  updateEntity,
  toggleEntityStatus,
}: {
  title: string;
  description: string;
  entityLabel: string;
  items: T[];
  icon: LucideIcon;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  createEntity: (name: string, status: EntityStatus) => Promise<T>;
  updateEntity: (
    id: string,
    patch: { name?: string; status?: EntityStatus }
  ) => Promise<T>;
  toggleEntityStatus: (id: string) => Promise<T>;
}) {
  // Clone on init: `items` is the same array reference the dummy API
  // mutates directly (see src/lib/api.ts), so state must own a separate
  // copy or a create/update would be double-applied — once by the API's
  // in-place mutation, once by this component's optimistic state update.
  const [entities, setEntities] = useState(() => [...items]);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entities;
    return entities.filter((item) => item.name.toLowerCase().includes(q));
  }, [entities, query]);

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setActive(true);
    setSheetOpen(true);
  };

  const openEdit = (item: T) => {
    setEditingId(item.id);
    setName(item.name);
    setActive(item.status === "active");
    setSheetOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    setTogglingId(id);
    try {
      const updated = await toggleEntityStatus(id);
      setEntities((rows) =>
        rows.map((row) => (row.id === id ? updated : row))
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateEntity(editingId, {
          name: trimmed,
          status: active ? "active" : "inactive",
        });
        setEntities((rows) =>
          rows.map((row) => (row.id === editingId ? updated : row))
        );
      } else {
        const created = await createEntity(
          trimmed,
          active ? "active" : "inactive"
        );
        setEntities((rows) => [...rows, created]);
      }
      setSheetOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SiteHeader title={title} description={description} />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={openAdd}>
            <Plus />
            Add
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Icon}
                title={emptyTitle}
                description={emptyDescription}
              />
            ) : (
              <div className="divide-y">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <Badge
                          variant={
                            item.status === "active" ? "default" : "secondary"
                          }
                          className="mt-0.5"
                        >
                          {item.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(item)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={togglingId === item.id}
                          onClick={() => handleToggleStatus(item.id)}
                        >
                          {item.status === "active" ? "Inactive" : "Activate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingId ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
            </SheetTitle>
            <SheetDescription>
              {editingId
                ? `Update this ${entityLabel.toLowerCase()}'s details.`
                : `Create a new ${entityLabel.toLowerCase()}.`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="entity-name">Name</Label>
              <Input
                id="entity-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${entityLabel} name`}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <Label htmlFor="entity-active" className="font-normal">
                Active
              </Label>
              <Switch
                id="entity-active"
                checked={active}
                onCheckedChange={setActive}
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleSave} disabled={!name.trim() || saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
