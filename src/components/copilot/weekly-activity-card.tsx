import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { StatTile } from "@/components/copilot/tool-ui";
import type { WeeklyActivityResult } from "@/lib/assistant-tools";

const chartConfig = {
  logs: { label: "Logs", color: "var(--primary)" },
  unitsLogged: { label: "Units logged", color: "var(--primary)" },
} satisfies ChartConfig;

export function WeeklyActivityCard({ result }: { result: WeeklyActivityResult }) {
  return (
    <Card size="sm" className="my-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Weekly activity</CardTitle>
        <Badge variant="outline">Last 7 days</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Logs" value={result.totalLogs} />
          <StatTile label="Units" value={result.totalUnitsLogged} />
          <StatTile label="Active days" value={`${result.activeDays}/7`} />
        </div>
        {result.totalLogs === 0 ? (
          <p className="text-xs text-muted-foreground">
            No stock logs were recorded between {result.from} and {result.to}.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-32 w-full">
            <BarChart data={result.daily} margin={{ left: -24 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickCount={3}
                width={40}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="logs"
                fill="var(--color-logs)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
