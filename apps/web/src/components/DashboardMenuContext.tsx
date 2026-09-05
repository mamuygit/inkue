"use client";

import { createContext, useContext, useMemo, useState } from "react";

type DashboardMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DashboardMenuContext = createContext<DashboardMenuContextValue | null>(null);

export function DashboardMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <DashboardMenuContext.Provider value={value}>{children}</DashboardMenuContext.Provider>;
}

export function useDashboardMenu() {
  return useContext(DashboardMenuContext);
}
