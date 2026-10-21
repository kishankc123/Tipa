import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/** Small label/value tile — same look as the stat cards on the dashboard,
 *  sized to fit the narrow chat panel. */
export function StatTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-primary/15 p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold leading-tight">{value}</p>
    </div>
  );
}

export function ToolLoading({ label }: { label: string }) {
  return (
    <Card size="sm" className="my-2">
      <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        {label}
      </CardContent>
    </Card>
  );
}

export function ToolMessage({ message }: { message: string }) {
  return (
    <Card size="sm" className="my-2">
      <CardContent className="text-xs text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}
