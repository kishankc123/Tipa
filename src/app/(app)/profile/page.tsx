import Link from "next/link";
import {
  BellRing,
  Box,
  ChevronRight,
  ClipboardList,
  Grid2x2,
  Layers,
  Mail,
  PlayCircle,
  Store,
  User,
  Users,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { dashboardSummary } from "@/lib/mock-data";

const links = [
  { title: "Edit Profile", href: "/edit-profile", icon: User },
  { title: "Group Management", href: "/group-management", icon: Layers },
  { title: "Category Management", href: "/category-management", icon: Grid2x2 },
  { title: "Storeplace Management", href: "/storeplace-management", icon: Store },
  { title: "Units Management", href: "/units-management", icon: Box },
  { title: "Logs Management", href: "/logs", icon: ClipboardList },
  { title: "Team Members", href: "/team-members", icon: Users },
  { title: "Log Alerts", href: "/log-alerts", icon: BellRing },
  { title: "Tutorials", href: "/tutorials", icon: PlayCircle },
  { title: "Contact Us", href: "/contact-us", icon: Mail },
];

export default function ProfilePage() {
  return (
    <>
      <SiteHeader title="Profile" description="Manage your account and store" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">
                G
              </AvatarFallback>
            </Avatar>
            <p className="text-lg font-semibold">GENERAL STORE</p>
            <p className="text-sm opacity-70">kishankcofc@gmail.com</p>
            <Badge className="mt-1">Owner</Badge>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex flex-col items-center gap-1 py-4">
              <p className="text-2xl font-bold">
                {dashboardSummary.productCount}
              </p>
              <p className="text-xs font-medium">Products</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-1 py-4">
              <p className="text-2xl font-bold">
                {dashboardSummary.logCount}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Logs
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex flex-col items-center gap-1 py-4">
              <p className="text-2xl font-bold">
                {dashboardSummary.teamCount}
              </p>
              <p className="text-xs font-medium">Team</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
                >
                  <link.icon className="size-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{link.title}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
