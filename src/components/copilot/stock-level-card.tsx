import { Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/copilot/tool-ui";
import type { StockLevelResult } from "@/lib/assistant-tools";

export function StockLevelCard({ result }: { result: StockLevelResult }) {
  const status =
    result.stock <= 0
      ? { label: "Out of stock", variant: "destructive" as const }
      : result.lowStock
        ? { label: "Low stock", variant: "destructive" as const }
        : { label: "In stock", variant: "default" as const };

  return (
    <Card size="sm" className="my-2">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-sm">{result.name}</CardTitle>
          {!result.isActive ? (
            <p className="text-xs text-muted-foreground">Inactive product</p>
          ) : null}
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label="Total stock"
            value={`${result.stock}${result.unit ? ` ${result.unit}` : ""}`}
          />
          <StatTile
            label="Reorder at"
            value={result.threshold > 0 ? result.threshold : "—"}
          />
        </div>
        {result.places.length > 0 ? (
          <ul className="space-y-1 text-xs">
            {result.places.map((place) => (
              <li
                key={place.name}
                className="flex items-center justify-between rounded-md border px-2 py-1.5"
              >
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Store className="size-3" />
                  {place.name}
                </span>
                <span className="font-medium">{place.stock}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {result.otherMatches.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Also matched: {result.otherMatches.join(", ")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
