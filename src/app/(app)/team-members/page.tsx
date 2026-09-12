"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createTeamMember } from "@/lib/api";
import { teamMembers as initialTeamMembers } from "@/lib/mock-data";
import type { TeamRole } from "@/lib/types";

const roles: TeamRole[] = ["manager", "staff"];

export default function TeamMembersPage() {
  // Clone on init: `initialTeamMembers` is the same array the dummy API
  // mutates directly, so state must own a separate copy or "Add" would
  // double-apply (once via the API push, once via this component's
  // optimistic state update).
  const [teamMembers, setTeamMembers] = useState(() => [...initialTeamMembers]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("staff");
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setName("");
    setEmail("");
    setRole("staff");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const member = await createTeamMember({
        name: name.trim(),
        email: email.trim(),
        role,
      });
      setTeamMembers((rows) => [...rows, member]);
      setSheetOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SiteHeader title="Team Members" description="Manage your team access" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex justify-end">
          <Button onClick={openAdd}>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Team Member</SheetTitle>
            <SheetDescription>
              Invite a team member and set their access role.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="member-name">Name</Label>
              <Input
                id="member-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as TeamRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !email.trim() || saving}
            >
              {saving ? "Adding..." : "Add"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
