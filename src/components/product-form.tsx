"use client";

import { useState } from "react";
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
import { categories, groups, storePlaces, units } from "@/lib/mock-data";

export interface ProductFormValues {
  name: string;
  groupId: string;
  categoryId: string;
  unitId: string;
  price: string;
  active: boolean;
  pinned: boolean;
  description: string;
  trackInventory: boolean;
  stockRows: { storePlaceId: string; quantity: string }[];
}

export const emptyProductFormValues: ProductFormValues = {
  name: "",
  groupId: "",
  categoryId: "",
  unitId: "",
  price: "",
  active: true,
  pinned: false,
  description: "",
  trackInventory: true,
  stockRows: [{ storePlaceId: "", quantity: "" }],
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
  onSubmit: (values: ProductFormValues) => void;
}) {
  const [name, setName] = useState(defaultValues.name);
  const [groupId, setGroupId] = useState(defaultValues.groupId);
  const [categoryId, setCategoryId] = useState(defaultValues.categoryId);
  const [unitId, setUnitId] = useState(defaultValues.unitId);
  const [price, setPrice] = useState(defaultValues.price);
  const [active, setActive] = useState(defaultValues.active);
  const [pinned, setPinned] = useState(defaultValues.pinned);
  const [description, setDescription] = useState(defaultValues.description);
  const [trackInventory, setTrackInventory] = useState(
    defaultValues.trackInventory
  );
  const [stockRows, setStockRows] = useState(defaultValues.stockRows);

  const updateStockRow = (
    index: number,
    patch: Partial<{ storePlaceId: string; quantity: string }>
  ) => {
    setStockRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const removeStockRow = (index: number) => {
    setStockRows((rows) => rows.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name,
      groupId,
      categoryId,
      unitId,
      price,
      active,
      pinned,
      description,
      trackInventory,
      stockRows,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!name.trim()}>
          {ActionIcon ? <ActionIcon /> : null}
          {actionLabel}
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
            <Label>Group</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select group..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Units</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select unit..." />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Price</Label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>Rs</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="price"
                inputMode="decimal"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </InputGroup>
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
                    value={row.storePlaceId}
                    onValueChange={(value) =>
                      updateStockRow(index, { storePlaceId: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select store place" />
                    </SelectTrigger>
                    <SelectContent>
                      {storePlaces.map((place) => (
                        <SelectItem key={place.id} value={place.id}>
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
                  { storePlaceId: "", quantity: "" },
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
