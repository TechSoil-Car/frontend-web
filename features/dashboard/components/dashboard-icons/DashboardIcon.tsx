type IconName = "overview" | "field" | "sensor" | "mission" | "alert" | "team" | "settings" | "search" | "bell" | "chevron" | "calendar" | "cloud" | "menu" | "close" | "arrow" | "battery" | "location" | "refresh";

type DashboardIconProps = {
  name: IconName;
  size?: number;
};

const paths: Record<IconName, React.ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  field: <><path d="M4 20c3-6 6-9 8-16 2 7 5 10 8 16"/><path d="M8 15h8M10 10h4"/></>,
  sensor: <><path d="M8.5 15.5a5 5 0 1 1 7 0"/><path d="M6 18a8.5 8.5 0 1 1 12 0"/><circle cx="12" cy="12" r="1.5"/></>,
  mission: <><path d="M5 17h14l-1.5-6h-11L5 17Z"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><path d="M9 8h6M12 8V5"/></>,
  alert: <><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17.5v.5"/></>,
  team: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-4 2-6 5.5-6s5.5 2 5.5 6"/><circle cx="17" cy="9" r="2.3"/><path d="M15.5 15c3.3-.3 5 1.5 5 4.5"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.5 1a8 8 0 0 0-1.7-1L14.3 3h-4.1L9.7 6a8 8 0 0 0-1.7 1L5.5 6 3.5 9.5l2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.5-1a8 8 0 0 0 1.7 1l.5 3h4.1l.5-3a8 8 0 0 0 1.7-1l2.5 1 2-3.5-2-1.5a7 7 0 0 0 .1-1Z"/></>,
  search: <><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></>,
  chevron: <path d="m9 7 5 5-5 5"/>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
  cloud: <path d="M7 18h11a4 4 0 0 0 .5-8A7 7 0 0 0 5 11.5 3.5 3.5 0 0 0 7 18Z"/>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  arrow: <path d="M5 12h14M14 7l5 5-5 5"/>,
  battery: <><rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4"/></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.3-2.6L20 9M4 15l2.6 2.6A7 7 0 0 0 17.9 15"/></>,
};

export function DashboardIcon({ name, size = 20 }: DashboardIconProps) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
