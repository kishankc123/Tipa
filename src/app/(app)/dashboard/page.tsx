import Link from "next/link";
import { ClipboardList, Package, Users, Wallet } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardSummary,
  inventoryLogs,
  products,
} from "@/lib/mock-data";

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
    href: "/profile/team",
  },
];

export default function DashboardPage() {
  return (
    <>
      <SiteHeader title="Dashboard" description="Good evening, KISHANKC" />
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

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No products yet.
                </p>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rs {product.price.toFixed(2)} · Stock {product.stock}
                      </p>
                    </div>
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No inventory logs recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {inventoryLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {log.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.date}
                        </p>
                      </div>
                      <Badge variant="outline">{log.changeType}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
