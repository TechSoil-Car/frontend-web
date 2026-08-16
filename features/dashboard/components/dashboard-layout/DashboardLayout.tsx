"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { DashboardHeader } from "../dashboard-header/DashboardHeader";
import { DashboardSidebar } from "../dashboard-sidebar/DashboardSidebar";
import styles from "./DashboardLayout.module.css";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={styles.content}>
        <DashboardHeader onMenuOpen={() => setMenuOpen(true)} />
        {children}
      </div>
    </div>
  );
}
