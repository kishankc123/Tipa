"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { createTeamMember, listTeamMembers, setTeamMemberActive } from "@/lib/api";
import type { ApiTeamMember, TeamMemberRoleEnum } from "@/lib/types";

const roles: TeamMemberRoleEnum[] = ["member", "supervisor"];

export default function TeamMembersPage() {
  const [teamMembers, setTeamMembers] = useState<ApiTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<TeamMemberRoleEnum>("member");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listTeamMembers()
      .then((data) => {
        if (!cancelled) setTeamMembers(data);
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "Failed to load team members");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openAdd = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("member");
    setFormError(null);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!username.trim() || !email.trim() || password.length < 8) return;
    setSaving(true);
    setFormError(null);
    try {
      await createTeamMember({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      });
      const refreshed = await listTeamMembers();
      setTeamMembers(refreshed);
      setSheetOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add team member.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member: ApiTeamMember) => {
    setUpdatingId(member.id);
    try {
      const updated = await setTeamMemberActive(member.id, !member.is_active);
      setTeamMembers((rows) =>
        rows.map((row) => (row.id === updated.id ? updated : row))
      );
    } finally {
      setUpdatingId(null);
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
            {loading ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Loading team members...
              </p>
            ) : loadError ? (
              <p className="p-6 text-center text-sm text-destructive">{loadError}</p>
            ) : teamMembers.length === 0 ? (
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
                      <p className="text-sm font-medium">{member.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {member.team_role}
                      </Badge>
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            variant={member.is_active ? "destructive" : "default"}
                            disabled={updatingId === member.id}
                            onClick={() => handleToggleActive(member)}
                          >
                            {member.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="member-username">Username</Label>
              <Input
                id="member-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
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
              <Label htmlFor="member-password">Password</Label>
              <Input
                id="member-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as TeamMemberRoleEnum)}
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
              disabled={
                !username.trim() || !email.trim() || password.length < 8 || saving
              }
            >
              {saving ? "Adding..." : "Add"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
