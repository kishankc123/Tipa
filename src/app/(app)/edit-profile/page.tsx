"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, getCurrentUser, updateProfile } from "@/lib/api";

export default function EditProfilePage() {
  const [username, setUsername] = useState("");
  const [contact, setContact] = useState("");
  const [company, setCompany] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        setUsername(user.username);
        setContact(user.contact_number ?? "");
        setCompany(user.business_name ?? "");
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      if (newPassword || currentPassword || confirmNewPassword) {
        if (newPassword !== confirmNewPassword) {
          throw new Error("New password and confirmation do not match.");
        }
        await changePassword({
          currentPassword,
          newPassword,
          confirmNewPassword,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
      await updateProfile({
        username,
        contactNumber: contact || undefined,
        businessName: company || undefined,
      });
      setSavedMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <SiteHeader title="Edit Profile" backHref="/profile" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Loading profile...
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader
        title="Edit Profile"
        description="Manage your profile and password"
        backHref="/profile"
      />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}
        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
            <div className="relative">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">
                  {username.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Pencil className="size-3" />
              </button>
            </div>
            <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
              Owner
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <p className="text-xs text-muted-foreground">
              Optional — leave blank to keep your current password
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {savedMessage ? (
              <p className="text-xs text-primary">{savedMessage}</p>
            ) : null}
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
