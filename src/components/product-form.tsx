"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Plus, Store, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  listApiCategories,
  listApiGroups,
  listApiStoragePlaces,
  listApiUnits,
} from "@/lib/api";
import type { ApiCategory, ApiGroup, ApiStoragePlace, ApiUnit } from "@/lib/types";

export interface ProductFormValues {
  name: string;
  groupSlug: string;
  categorySlug: string;
  unitSlug: string;
  costPrice: string;
  sellingPrice: string;
  active: boolean;
  pinned: boolean;
  description: string;
  trackInventory: boolean;
  stockRows: { storagePlaceSlug: string; quantity: string }[];
}

export const emptyProductFormValues: ProductFormValues = {
  name: "",
  groupSlug: "",
  categorySlug: "",
  unitSlug: "",
  costPrice: "",
  sellingPrice: "",
  active: true,
  pinned: false,
  description: "",
  trackInventory: true,
  stockRows: [{ storagePlaceSlug: "", quantity: "" }],
};

export function ProductForm({
  defaultValues,
  actionLabel,
  actionIcon: ActionIcon,
  onSubmit,
}: {
  defaultValues: ProductFormValues;
  actionLabel: string;
  actionIcon?: typeof Plus;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(defaultValues.name);
  const [groupSlug, setGroupSlug] = useState(defaultValues.groupSlug);
  const [categorySlug, setCategorySlug] = useState(defaultValues.categorySlug);
  const [unitSlug, setUnitSlug] = useState(defaultValues.unitSlug);
  const [costPrice, setCostPrice] = useState(defaultValues.costPrice);
  const [sellingPrice, setSellingPrice] = useState(defaultValues.sellingPrice);
  const [active, setActive] = useState(defaultValues.active);
  const [pinned, setPinned] = useState(defaultValues.pinned);
  const [description, setDescription] = useState(defaultValues.description);
  const [trackInventory, setTrackInventory] = useState(
    defaultValues.trackInventory
  );
  const [stockRows, setStockRows] = useState(defaultValues.stockRows);

  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [units, setUnits] = useState<ApiUnit[]>([]);
  const [storagePlaces, setStoragePlaces] = useState<ApiStoragePlace[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listApiGroups(),
      listApiCategories(),
      listApiUnits(),
      listApiStoragePlaces(),
    ])
      .then(([g, c, u, s]) => {
        if (cancelled) return;
        setGroups(g);
        setCategories(c);
        setUnits(u);
        setStoragePlaces(s);
      })
      .finally(() => {
        if (!cancelled) setLoadingLookups(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateStockRow = (
    index: number,
    patch: Partial<{ storagePlaceSlug: string; quantity: string }>
  ) => {
    setStockRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const removeStockRow = (index: number) => {
    setStockRows((rows) => rows.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        groupSlug,
        categorySlug,
        unitSlug,
        costPrice,
        sellingPrice,
        active,
        pinned,
        description,
        trackInventory,
        stockRows,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
          {ActionIcon ? <ActionIcon /> : null}
          {submitting ? "Saving..." : actionLabel}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ImagePlus className="size-5" />
            <span className="text-xs">Add</span>
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Wireless ANC Headphones"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Group <span className="text-destructive">*</span>
            </Label>
            <Select value={groupSlug} onValueChange={setGroupSlug}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingLookups ? "Loading groups..." : "Select group..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.slug} value={group.slug}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingLookups ? "Loading categories..." : "Select category..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Units <span className="text-destructive">*</span>
            </Label>
            <Select value={unitSlug} onValueChange={setUnitSlug}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={loadingLookups ? "Loading units..." : "Select unit..."}
                />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.slug} value={unit.slug}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cost-price">Cost Price</Label>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>Rs</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="cost-price"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="selling-price">Selling Price</Label>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>Rs</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="selling-price"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </InputGroup>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <Label htmlFor="active" className="font-normal">
              Active Product
            </Label>
            <Switch id="active" checked={active} onCheckedChange={setActive} />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <Label htmlFor="pinned" className="font-normal">
              Pin Product
            </Label>
            <Switch id="pinned" checked={pinned} onCheckedChange={setPinned} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Add detailed product information..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Initial Stock</CardTitle>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="track-inventory"
              className="font-normal text-muted-foreground"
            >
              Track Inventory
            </Label>
            <Switch
              id="track-inventory"
              checked={trackInventory}
              onCheckedChange={setTrackInventory}
            />
          </div>
        </CardHeader>
        {trackInventory ? (
          <CardContent className="space-y-3">
            {stockRows.map((row, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label>Store Place</Label>
                  <Select
                    value={row.storagePlaceSlug}
                    onValueChange={(value) =>
                      updateStockRow(index, { storagePlaceSlug: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select store place" />
                    </SelectTrigger>
                    <SelectContent>
                      {storagePlaces.map((place) => (
                        <SelectItem key={place.slug} value={place.slug}>
                          <Store className="size-4" />
                          {place.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28 space-y-1.5">
                  <Label>Quantity</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="0"
                    value={row.quantity}
                    onChange={(e) =>
                      updateStockRow(index, { quantity: e.target.value })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mb-0.5 text-muted-foreground"
                  onClick={() => removeStockRow(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setStockRows((rows) => [
                  ...rows,
                  { storagePlaceSlug: "", quantity: "" },
                ])
              }
            >
              <Plus />
              Add Store Place
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
