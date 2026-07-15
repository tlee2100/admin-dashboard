import { AccessControlProvider } from "@refinedev/core";

// Define role-based permissions configuration for easy future updates
type Action = "list" | "show" | "create" | "edit" | "delete" | "clone" | string;

interface RolePermissions {
  // "*" means all resources are allowed (unless denied below)
  allowedResources: "*" | string[];
  deniedResources?: string[];
  // Map of resource name -> array of actions that are NOT allowed
  deniedActions?: Record<string, Action[]>;
}

const ROLES: Record<string, RolePermissions> = {
  SUPER_ADMIN: {
    allowedResources: "*",
  },
  ADMIN: {
    allowedResources: "*",
    deniedResources: ["organizations"],
  },
  AGENT: {
    allowedResources: "*",
    deniedResources: ["users", "organizations"],
    deniedActions: {
      sites: ["create", "edit", "delete"],
      documents: ["create", "edit", "delete"],
    },
  },
};

export const createAccessControlProvider = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: { role: string; id: number } | any,
): AccessControlProvider => ({
  can: async ({ resource, action, params }) => {
    const userRole = user?.role?.toUpperCase();

    // 1. Check if the role exists in our configuration
    if (!userRole || !ROLES[userRole]) {
      return { can: false, reason: "Unauthorized" };
    }

    const permissions = ROLES[userRole];

    const targetResource = resource ?? "";

    // 2. Check if the entire resource is explicitly denied
    if (permissions.deniedResources?.includes(targetResource)) {
      return { can: false, reason: "Unauthorized" };
    }

    // 3. Check if the resource is allowed (if it's not a wildcard "*")
    if (
      permissions.allowedResources !== "*" &&
      !permissions.allowedResources.includes(targetResource)
    ) {
      return { can: false, reason: "Unauthorized" };
    }

    // 4. Check if the specific action is denied for this resource
    if (permissions.deniedActions?.[targetResource]?.includes(action)) {
      return { can: false, reason: "Unauthorized" };
    }

    // 5. Custom object-level permissions
    if (targetResource === "chat/conversations/active" && action === "delete") {
      const conversation = params?.conversation;
      // Only the agent assigned to the conversation can delete it.
      if (
        !conversation?.agentId ||
        String(conversation.agentId) !== String(user?.id)
      ) {
        return {
          can: false,
          reason: "Only the assigned agent can delete this conversation.",
        };
      }
    }

    // If it passes all checks, access is granted
    return { can: true };
  },
});
