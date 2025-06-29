export interface SidebarItem {
  title: string;
  route: string;
  icon: string;
}

export interface SidebarItems {
  communication: SidebarItem[]
  other: SidebarItem[]
}
