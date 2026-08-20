import { FileWarning } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";

export default function LogAlertsPage() {
  const alerts: never[] = [];

  return (
    <>
      <SiteHeader title="Log Alerts" description={`${alerts.length} Items`} />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={FileWarning}
              title="No corrected logs"
              description="Resubmitted logs will appear here for review."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
