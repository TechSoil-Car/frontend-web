"use client";

import { useState } from "react";
import { DashboardHeader } from "../dashboard-header/DashboardHeader";
import { DashboardOverview } from "../dashboard-overview/DashboardOverview";
import { DashboardSidebar } from "../dashboard-sidebar/DashboardSidebar";
import styles from "./DashboardScreen.module.css";

export function DashboardScreen() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={styles.content}>
        <DashboardHeader onMenuOpen={() => setMenuOpen(true)} />
        <DashboardOverview />
      </div>
    </div>
  );
}
