"use client";

import { useForm } from "@refinedev/react-hook-form";
import { useEffect } from "react";
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

interface SiteFormDialogProps {
  isOpen: boolean;
  editId: string | null;
  orgOptions?: OptionItem[];
  isSuperAdmin?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SiteFormDialog({
  isOpen,
  editId,
  orgOptions = [],
  isSuperAdmin = false,
  onClose,
  onSuccess,
}: SiteFormDialogProps) {
  const {
    refineCore: { onFinish, formLoading, query },
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    refineCoreProps: {
      resource: "sites",
      action: editId ? "edit" : "create",
      id: editId ?? undefined,
      onMutationSuccess: () => {
        handleClose();
        if (onSuccess) onSuccess();
      },
    },
  });

  const handleClose = () => {
    reset({ name: "", url: "", organizationId: "" });
    onClose();
  };

  useEffect(() => {
    if (editId && query?.data?.data) {
      const site = query.data.data as {
        name: string;
        url: string;
        organizationId?: number;
      };
      reset({
        name: site.name,
        url: site.url,
        organizationId: site.organizationId || "",
      });
    }
  }, [editId, query?.data?.data, reset]);

  const handleCustomSubmit = (data: Record<string, unknown>) => {
    const payload = { ...data };
    if (payload.organizationId === "") {
      delete payload.organizationId;
    }
    onFinish(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Site" : "Add New Site"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleCustomSubmit)}
          className="flex flex-col gap-4 mt-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Website Name</label>
            <Input
              {...register("name", {
                required: "Please enter website name",
              })}
              placeholder="e.g. Acme Corp"
            />
            {errors.name && (
              <span className="text-xs text-destructive">
                {errors.name.message as string}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Domain / URL</label>
            <Input
              {...register("url", {
                required: "Please enter domain or URL",
              })}
              placeholder="e.g. acme.com or https://acme.com"
            />
            {errors.url && (
              <span className="text-xs text-destructive">
                {errors.url.message as string}
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
                  : "Create Site"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
