import Link from "next/link";
import { Users, UserCheck, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function QuickActionsCard() {
  return (
    <Card className="border-primary/5 flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        <CardDescription>Shortcuts to key administration areas</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 pt-2">
        <Link href="/dashboard/users" className="group">
          <div className="flex items-center justify-between rounded-lg border border-primary/5 bg-card p-3 shadow-xs transition-all duration-200 hover:border-primary/20 hover:bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-500/10 p-2 text-blue-500 group-hover:bg-blue-500/20">
                <Users className="size-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">User Management</p>
                <p className="text-xs text-muted-foreground">
                  Add, edit, or remove Agent/Admin permissions.
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </Link>

        <Link href="/dashboard/profile" className="group">
          <div className="flex items-center justify-between rounded-lg border border-primary/5 bg-card p-3 shadow-xs transition-all duration-200 hover:border-primary/20 hover:bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-indigo-500/10 p-2 text-indigo-500 group-hover:bg-indigo-500/20">
                <UserCheck className="size-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Personal Profile</p>
                <p className="text-xs text-muted-foreground">
                  Change password, avatar, and account information.
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </Link>

        <div className="rounded-xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-primary/5 p-4 flex items-center justify-between mt-2">
          <div className="space-y-1">
            <p className="text-sm font-bold">
              Need to integrate a new chatbot?
            </p>
            <p className="text-xs text-muted-foreground">
              Create a site and link a training document set now.
            </p>
          </div>
          <Link href="/dashboard/sites">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="size-3.5" />
              Add Website
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
