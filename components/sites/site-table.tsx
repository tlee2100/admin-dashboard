"use client";

import {
  Globe,
  FileText,
  Users,
  MessageSquare,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { CanAccess } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export interface SiteRecord {
  id: string;
  name: string;
  url: string;
  organization?: { id: number; name: string };
  knowledgeBaseStatus?: string;
}

interface SiteTableProps {
  sites: SiteRecord[];
  isLoading: boolean;
  onOpenDocuments: (siteId: string, siteName: string) => void;
  onOpenAgents: (siteId: string, siteName: string) => void;
  onEdit: (siteId: string) => void;
  onDelete: (siteId: string) => void;
}

function getKbStatusBadge(status?: string) {
  const normalized = (status || "pending").toLowerCase();
  switch (normalized) {
    case "completed":
    case "ready":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/5 text-emerald-500 gap-1"
        >
          <CheckCircle className="size-3" />
          Ready
        </Badge>
      );
    case "processing":
      return (
        <Badge
          variant="outline"
          className="border-blue-500/30 bg-blue-500/5 text-blue-500 gap-1"
        >
          <Loader2 className="size-3 animate-spin" />
          Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="outline"
          className="border-rose-500/30 bg-rose-500/5 text-rose-500 gap-1"
        >
          <AlertCircle className="size-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/5 text-amber-500 gap-1"
        >
          <span className="size-1.5 rounded-full bg-amber-500" />
          Pending
        </Badge>
      );
  }
}

export function SiteTable({
  sites,
  isLoading,
  onOpenDocuments,
  onOpenAgents,
  onEdit,
  onDelete,
}: SiteTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Website Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>KB Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-muted-foreground"
              >
                Loading data...
              </TableCell>
            </TableRow>
          ) : sites.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-muted-foreground"
              >
                No websites found
              </TableCell>
            </TableRow>
          ) : (
            sites.map((site) => (
              <TableRow
                key={site.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-medium">{site.name}</TableCell>
                <TableCell>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-blue-500 hover:underline"
                  >
                    <Globe className="size-3.5" />
                    {site.url}
                  </a>
                </TableCell>
                <TableCell>
                  {site.organization?.name ? (
                    <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 font-normal">
                      {site.organization.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">
                      None
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {getKbStatusBadge(site.knowledgeBaseStatus)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => onOpenDocuments(site.id, site.name)}
                    >
                      <FileText className="size-3.5" /> Documents
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => onOpenAgents(site.id, site.name)}
                    >
                      <Users className="size-3.5" /> Agents
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() =>
                        window.open(`/test-chat/${site.id}`, "_blank")
                      }
                    >
                      <MessageSquare className="size-3.5" /> Test-Chatting
                    </Button>
                    <CanAccess action="edit" resource="sites" fallback={null}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => onEdit(site.id)}
                      >
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                    </CanAccess>
                    <CanAccess action="delete" resource="sites" fallback={null}>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => onDelete(site.id)}
                      >
                        <Trash2 className="size-3.5" /> Delete
                      </Button>
                    </CanAccess>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
