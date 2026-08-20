"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Download, Info, Upload } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const notes = [
  "Excel should follow the proper format",
  "Only Excel files are accepted",
  "Download sample before creating file",
  "Product names should be unique",
  "Avoid empty required fields",
];

export default function AddBulkProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleUpload = () => {
    router.push("/products");
  };

  return (
    <>
      <SiteHeader
        title="Add Bulk Product"
        description="add products in bulk"
        backHref="/products"
      />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <Upload className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {fileName ?? "Choose Excel File"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Only .xls and .xlsx files supported
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Download className="size-4" />
            </div>
            <p className="flex-1 text-sm font-medium">
              Download Sample Excel Template
            </p>
            <ChevronRight className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-primary" />
              <p className="text-sm font-semibold">Important Notes</p>
            </div>
            <ul className="space-y-2">
              {notes.map((note) => (
                <li
                  key={note}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button onClick={handleUpload} disabled={!fileName}>
            Upload Products
          </Button>
          <Button variant="outline" onClick={() => router.push("/products")}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
