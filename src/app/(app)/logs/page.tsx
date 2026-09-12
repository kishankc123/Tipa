"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportLogs, listLogsByDay } from "@/lib/api";
import type { ApiLogsByDay } from "@/lib/types";

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function LogsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<ApiLogsByDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Show the loading state immediately when the date filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listLogsByDay({ from: from || undefined, to: to || undefined })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load logs");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      // The export endpoint requires both dates; default to a wide range
      // when the filters are left blank.
      const range = {
        from: from || "2000-01-01",
        to: to || toISODate(new Date()),
      };
      const { blob, filename } = await exportLogs(range);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Failed to export logs.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <SiteHeader title="Logs" description="Manage your inventory logs" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            {exportError ? (
              <Alert variant="destructive">
                <AlertDescription>{exportError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="sm:w-auto"
                onClick={handleExport}
                disabled={exporting}
              >
                <Download />
                {exporting ? "Exporting..." : "Export Logs"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>No of Logs</TableHead>
                  <TableHead className="text-right">Units Logged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-sm text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="p-0">
                      <EmptyState
                        title="No logs found"
                        description="No inventory logs available for the selected date range. Try adjusting the date range."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.count}</TableCell>
                      <TableCell className="text-right">{row.total_stock}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
