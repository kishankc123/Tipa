import Link from "next/link";
import { BarChart3, ChevronRight, Package } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { dashboardSummary } from "@/lib/mock-data";

const reports = [
  {
    title: "Product Wise Report",
    description: "Search a product and review its stock history logs.",
    href: "/reports/product-wise",
    icon: Package,
  },
  {
    title: "Inventory Valuation",
    description: "See current stock value across all products.",
    href: "/reports/valuation",
    icon: BarChart3,
  },
];

export default function ReportsPage() {
  return (
    <>
      <SiteHeader title="Reports" description="Inventory insights" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">
              Total Inventory Value
            </p>
            <p className="mt-1 text-3xl font-bold">
              Rs {dashboardSummary.totalInventoryValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((report) => (
            <Link key={report.href} href={report.href}>
              <Card className="h-full transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <report.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{report.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
