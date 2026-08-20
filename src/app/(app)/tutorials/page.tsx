import { Inbox, PlayCircle } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";

export default function TutorialsPage() {
  return (
    <>
      <SiteHeader title="Tutorials" description="Learn how to use the app" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <PlayCircle className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Learn How to Use the App
              </p>
              <p className="text-xs opacity-70">
                Watch short tutorials to learn every feature of the
                application.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Inbox}
              title="Nothing here yet"
              description="Tutorial videos will show up here once they are added."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
