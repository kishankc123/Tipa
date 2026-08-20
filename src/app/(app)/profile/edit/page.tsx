import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditProfilePage() {
  return (
    <>
      <SiteHeader title="Edit Profile" description="Manage your profile and password" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">
                K
              </AvatarFallback>
            </Avatar>
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
              <Input id="username" defaultValue="Kishankc" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact Number</Label>
              <Input id="contact" defaultValue="1234567891" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" defaultValue="General Store" />
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
              <Input id="current-password" type="password" placeholder="Enter current password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" placeholder="Enter new password" />
            </div>
            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
