import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader({
  title,
  description,
  backHref,
}: {
  title: string;
  description?: string;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {backHref ? (
        <Button variant="ghost" size="icon" className="-ml-1" asChild>
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      ) : (
        <SidebarTrigger className="-ml-1" />
      )}
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 flex-col">
        <h1 className="text-base font-semibold leading-tight">{title}</h1>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="size-4" />
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
      </Button>
    </header>
  );
}
