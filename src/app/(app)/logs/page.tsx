"use client";

import { Download } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
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
import { inventoryLogs } from "@/lib/mock-data";

export default function LogsPage() {
  const logsByDate = new Map<string, number>();
  for (const log of inventoryLogs) {
    logsByDate.set(log.date, (logsByDate.get(log.date) ?? 0) + 1);
  }
  const rows = Array.from(logsByDate.entries());

  return (
    <>
      <SiteHeader title="Logs" description="Manage your inventory logs" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">From</label>
                <Input type="date" />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">To</label>
                <Input type="date" />
              </div>
              <Button variant="outline" className="sm:w-auto">
                <Download />
                Export Logs
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="p-0">
                      <EmptyState
                        title="No logs found"
                        description="No inventory logs available for the selected date range. Try adjusting the date range."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(([date, count]) => (
                    <TableRow key={date}>
                      <TableCell>{date}</TableCell>
                      <TableCell>{count}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
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
