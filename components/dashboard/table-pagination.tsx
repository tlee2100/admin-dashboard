"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function TablePagination({
  currentPage,
  pageCount,
  onPageChange,
  className = "",
}: TablePaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div
      className={`flex items-center justify-between border-t border-border px-4 py-3 sm:px-6 ${className}`}
    >
      <div className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{currentPage}</span>{" "}
        of <span className="font-medium text-foreground">{pageCount}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="size-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
        >
          Next
          <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
