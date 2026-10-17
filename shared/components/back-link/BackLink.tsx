import Link from "next/link";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icons/DashboardIcon";
import styles from "./BackLink.module.css";

/** Pill link back to the parent screen, shown above a page title. */
export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link className={styles.back} href={href}>
      <DashboardIcon name="arrow" size={15} /> {children}
    </Link>
  );
}
