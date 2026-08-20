"use client";

import { Plus, Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { teamMembers } from "@/lib/mock-data";

export default function TeamMembersPage() {
  return (
    <>
      <SiteHeader title="Team Members" description="Manage your team access" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex justify-end">
          <Button>
            <Plus />
            Add
          </Button>
        </div>

        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Users className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Team List</p>
                <p className="text-xs opacity-70">
                  Review roles and member access
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary">
              {teamMembers.length} members
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {teamMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Team Members Yet"
                description="Add a team member to get started."
              />
            ) : (
              <div className="divide-y">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
