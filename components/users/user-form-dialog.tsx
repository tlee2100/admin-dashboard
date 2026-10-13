"use client";

import { useForm } from "@refinedev/react-hook-form";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OptionItem {
  label: string;
  value: string | number;
}

interface UserFormDialogProps {
  isOpen: boolean;
  editId: string | null;
  orgOptions?: OptionItem[];
  siteOptions?: OptionItem[];
  isSuperAdmin?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserFormDialog({
  isOpen,
  editId,
  orgOptions = [],
  siteOptions = [],
  isSuperAdmin = false,
  onClose,
  onSuccess,
}: UserFormDialogProps) {
  const { data: session } = useSession();
  const [pendingSiteId, setPendingSiteId] = useState<string | null>(null);

  const {
    refineCore: { onFinish, formLoading, query },
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    refineCoreProps: {
      resource: "users",
      action: editId ? "edit" : "create",
      id: editId ?? undefined,
      onMutationSuccess: async (data) => {
        if (!editId && pendingSiteId && data?.data?.id) {
          try {
            const apiUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const res = await fetch(`${apiUrl}/sites/${pendingSiteId}/agents`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.accessToken}`,
              },
              body: JSON.stringify({ agentId: data.data.id }),
            });
            if (!res.ok) throw new Error("Failed to assign agent");
            toast.success("User assigned to site successfully!");
          } catch (err) {
            console.error("Failed to assign site:", err);
            toast.error("User created but failed to assign to site.");
          }
        }
        handleClose();
        if (onSuccess) onSuccess();
      },
    },
  });

  const handleClose = () => {
    reset();
    setPendingSiteId(null);
    onClose();
  };

  useEffect(() => {
    if (editId && query?.data?.data) {
      const user = query.data.data as {
        name: string;
        email: string;
        role: string;
        organizationId?: number;
      };
      reset({
        name: user.name,
        email: user.email,
        organizationId: user.organizationId || "",
        password: "",
      });
    }
  }, [editId, query?.data?.data, reset]);

  const handleCustomSubmit = (data: Record<string, unknown>) => {
    const payload = { ...data };

    if (payload.siteId) {
      setPendingSiteId(payload.siteId as string);
    } else {
      setPendingSiteId(null);
    }
    delete payload.siteId;

    if (payload.password === "") {
      delete payload.password;
    }
    if (payload.organizationId === "" || payload.organizationId === null) {
      delete payload.organizationId;
    }
    delete payload.role;
    onFinish(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleCustomSubmit)}
          className="flex flex-col gap-4 mt-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              {...register("name", {
                required: "Please enter your full name",
              })}
              placeholder="e.g. John Doe"
            />
            {errors.name && (
              <span className="text-xs text-destructive">
                {errors.name.message as string}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              {...register("email", {
                required: "Please enter your email",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address format",
                },
              })}
              placeholder="john@example.com"
            />
            {errors.email && (
              <span className="text-xs text-destructive">
                {errors.email.message as string}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Password {editId && "(Leave blank to keep current password)"}
            </label>
            <Input
              type="password"
              {...register("password", {
                required: editId ? false : "Please enter a password",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              placeholder="••••••••"
            />
            {errors.password && (
              <span className="text-xs text-destructive">
                {errors.password.message as string}
              </span>
            )}
          </div>

          {/* Organization Selection (SUPER_ADMIN only) */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization</label>
              <select
                {...register("organizationId")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">No Organization</option>
                {orgOptions.map((org) => (
                  <option key={org.value} value={org.value}>
                    {org.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Site assignment for new users */}
          {!editId && siteOptions.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Assign to Website (Optional)
              </label>
              <select
                {...register("siteId")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">None</option>
                {siteOptions.map((site) => (
                  <option key={site.value} value={site.value}>
                    {site.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Assign this agent directly to manage a website.
              </p>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading
                ? "Saving..."
                : editId
                  ? "Save Changes"
                  : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
