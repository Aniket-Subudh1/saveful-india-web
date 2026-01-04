export interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  onClick?: () => void;
  children?: SidebarLink[];
}

export interface SidebarConfig {
  role: "admin" | "chef";
  userName: string;
  userEmail: string;
  links: SidebarLink[];
}

export interface DashboardLayoutProps {
  config: SidebarConfig;
  children: React.ReactNode;
}
