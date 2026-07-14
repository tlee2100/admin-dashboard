"use client";

import { useEffect, useState } from "react";
import DashboardLoading from "@/app/dashboard/loading";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <DashboardLoading />
      </div>
    );
  }

  return <>{children}</>;
}
