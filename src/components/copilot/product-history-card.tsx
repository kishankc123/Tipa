import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductHistoryResult } from "@/lib/assistant-tools";

function formatLoggedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ProductHistoryCard({ result }: { result: ProductHistoryResult }) {
  return (
    <Card size="sm" className="my-2">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <CardTitle className="text-sm">{result.name} — history</CardTitle>
        <Badge variant="outline">
          {result.entries.length} of {result.total}
        </Badge>
      </CardHeader>
      <CardContent>
        {result.entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No stock logs recorded for this product yet.
          </p>
        ) : (
          <ul className="divide-y text-xs">
            {result.entries.map((entry, i) => (
              <li
                key={`${entry.loggedAt}-${i}`}
                className="flex items-center justify-between gap-2 py-1.5"
              >
                <div>
                  <p className="font-medium">{formatLoggedAt(entry.loggedAt)}</p>
                  <p className="text-muted-foreground">{entry.place || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{entry.stock}</span>
                  <Badge variant="secondary" className="capitalize">
                    {entry.reviewStatus}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
