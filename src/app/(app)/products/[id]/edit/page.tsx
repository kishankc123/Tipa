"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, Store, Trash2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
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
import { categories, groups, products, storePlaces, units } from "@/lib/mock-data";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const product = products.find((p) => p.id === id);

  const [name, setName] = useState(product?.name ?? "");
  const [groupId, setGroupId] = useState(product?.groupId ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [unitId, setUnitId] = useState(product?.unitId ?? "");
  const [price, setPrice] = useState(product?.price.toFixed(2) ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [pinned, setPinned] = useState(product?.pinned ?? false);
  const [description, setDescription] = useState(product?.description ?? "");
  const [trackInventory, setTrackInventory] = useState(true);
  const [stockRows, setStockRows] = useState(
    product?.storeStock.map((entry) => ({
      storePlaceId: entry.storePlaceId,
      quantity: String(entry.quantity),
    })) ?? [{ storePlaceId: "", quantity: "" }]
  );

  if (!product) {
    return (
      <>
        <SiteHeader title="Edit Product" backHref="/products" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-medium">Product not found</p>
          <Button variant="outline" onClick={() => router.push("/products")}>
            Back to Products
          </Button>
        </div>
      </>
    );
  }

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

  const handleUpdate = () => {
    router.push(`/products/${id}`);
  };

  return (
    <>
      <SiteHeader
        title="Edit Product"
        description="Update product details"
        backHref={`/products/${id}`}
      />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex justify-end">
          <Button onClick={handleUpdate}>Update</Button>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a group" />
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
                  <SelectValue placeholder="Select a category" />
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
                  <SelectValue placeholder="Select a unit" />
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
              <Label htmlFor="track-inventory" className="font-normal text-muted-foreground">
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
    </>
  );
}
