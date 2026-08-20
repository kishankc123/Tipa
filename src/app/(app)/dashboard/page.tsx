"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Box,
  ChevronRight,
  ClipboardList,
  Grid2x2,
  Layers,
  Package,
  PackagePlus,
  Pin,
  Store,
  Users,
  Wallet,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { dashboardSummary, inventoryLogs, products } from "@/lib/mock-data";

const stats = [
  {
    title: "Total Inventory Value",
    value: `Rs ${dashboardSummary.totalInventoryValue.toFixed(2)}`,
    icon: Wallet,
  },
  {
    title: "Products",
    value: dashboardSummary.productCount,
    icon: Package,
    href: "/products",
  },
  {
    title: "Logs",
    value: dashboardSummary.logCount,
    icon: ClipboardList,
    href: "/logs",
  },
  {
    title: "Team",
    value: dashboardSummary.teamCount,
    icon: Users,
    href: "/team-members",
  },
];

const quickActions = [
  { title: "Add Product", href: "/products", icon: PackagePlus },
  { title: "Stock Logs", href: "/logs", icon: ClipboardList },
  { title: "Groups", href: "/group-management", icon: Layers },
  { title: "Categories", href: "/category-management", icon: Grid2x2 },
  { title: "Units", href: "/units-management", icon: Box },
  { title: "Storeplace", href: "/storeplace-management", icon: Store },
];

const chartConfig = {
  units: {
    label: "Units",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getLastNDays(n: number, reference: Date) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(reference);
    d.setDate(reference.getDate() - (n - 1 - i));
    return d;
  });
}

function getGreeting(reference: Date) {
  const hour = reference.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardPage() {
  // `new Date()` differs between the server render and the client render,
  // so all "today"-dependent values are computed after mount to avoid a
  // hydration mismatch — the first client render matches the server's
  // static placeholder, then swaps in the real values.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const days = now ? getLastNDays(7, now) : [];
  const todayIso = now ? toISODate(now) : "";

  const unitMovementData = days.map((d) => {
    const iso = toISODate(d);
    const units = inventoryLogs
      .filter((log) => log.date === iso)
      .reduce((sum, log) => sum + Math.abs(log.change), 0);
    return {
      date: iso,
      label: d.toLocaleDateString(undefined, { day: "numeric" }),
      units,
    };
  });

  const weekDays = days.map((d) => {
    const iso = toISODate(d);
    return {
      iso,
      weekday: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      dayNumber: d.getDate(),
      isToday: iso === todayIso,
      hasActivity: inventoryLogs.some((log) => log.date === iso),
    };
  });

  const pinnedProducts = products.filter((p) => p.pinned);

  return (
    <>
      <SiteHeader
        title="Dashboard"
        description={now ? `${getGreeting(now)} KISHANKC` : "KISHANKC"}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const content = (
              <Card key={stat.title} className="h-full">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="size-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
            return stat.href ? (
              <Link key={stat.title} href={stat.href} className="block">
                {content}
              </Link>
            ) : (
              content
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="flex w-24 shrink-0 flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors hover:border-primary hover:bg-accent"
                >
                  <div className="flex size-9 items-center justify-center rounded-full border">
                    <action.icon className="size-4" />
                  </div>
                  <span className="text-xs font-medium">{action.title}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Unit Movement</CardTitle>
              <p className="text-xs text-muted-foreground">
                Daily unit movement
              </p>
            </div>
            <Badge variant="outline">Last 7 Days</Badge>
          </CardHeader>
          <CardContent>
            {now ? (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <AreaChart data={unitMovementData} margin={{ left: -20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="units"
                    type="monotone"
                    fill="var(--color-units)"
                    fillOpacity={0.15}
                    stroke="var(--color-units)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>This week</CardTitle>
            <Link
              href="/logs"
              className="flex items-center gap-0.5 text-sm font-medium text-primary"
            >
              View all
              <ChevronRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {now ? (
              <div className="grid grid-cols-7 gap-2 text-center">
                {weekDays.map((day) => (
                  <div
                    key={day.iso}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span className="text-xs text-muted-foreground">
                      {day.weekday}
                    </span>
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full text-sm font-semibold",
                        day.isToday && "bg-primary text-primary-foreground"
                      )}
                    >
                      {day.dayNumber}
                    </span>
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        day.hasActivity ? "bg-destructive" : "bg-transparent"
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Pinned Products</CardTitle>
            <Link
              href="/products"
              className="flex items-center gap-0.5 text-sm font-medium text-primary"
            >
              See All
              <ChevronRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {pinnedProducts.length === 0 ? (
              <EmptyState
                icon={Pin}
                title="No pinned products"
                description="Pin products from their detail page to see them here."
              />
            ) : (
              <div className="space-y-3">
                {pinnedProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Package className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Rs {product.price.toFixed(2)} · Stock {product.stock}
                        </p>
                      </div>
                    </div>
                    <Pin className="size-4 fill-muted-foreground text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
