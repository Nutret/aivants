import {
  LayoutDashboard,
  Users,
  Upload,
  Megaphone,
  FileText,
  Kanban,
  BarChart3,
  Settings,
  LogOut,
  ScrollText,
  FolderOpen,
  Clock,
  CalendarClock,
  Briefcase,
  FolderKanban,
  IndianRupee,
  UsersRound,
  Bot,
  BookOpen,
  Plug,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const dashboardItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

const businessItems = [
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Clients", url: "/clients", icon: Briefcase },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Proposals", url: "/proposals", icon: FileText },
];

const operationsItems = [
  { title: "Campaigns", url: "/campaigns", icon: Megaphone },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Scripts", url: "/scripts", icon: ScrollText },
  { title: "Content", url: "/content", icon: FolderOpen },
  { title: "Sequences", url: "/sequences", icon: Clock },
  { title: "Follow-Ups", url: "/follow-ups", icon: CalendarClock },
];

const intelligenceItems = [
  { title: "Pipeline", url: "/pipeline", icon: Kanban },
  { title: "Revenue", url: "/revenue", icon: IndianRupee },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
];

const systemItems = [
  { title: "Team", url: "/team", icon: UsersRound },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const renderGroup = (label: string, items: typeof dashboardItems) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground/60">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="hover:bg-sidebar-accent transition-colors duration-150"
                  activeClassName="bg-sidebar-accent text-foreground font-medium"
                >
                  <item.icon className="h-4 w-4 opacity-60" />
                  {!collapsed && <span className="text-[13px]">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <img src="/logo-light.png" alt="Aivants" className="h-7 object-contain" />
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight text-foreground">Aivants</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {renderGroup("", dashboardItems)}
        {renderGroup("Business", businessItems)}
        {renderGroup("Operations", operationsItems)}
        {renderGroup("Intelligence", intelligenceItems)}
        {renderGroup("System", systemItems)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="hover:bg-sidebar-accent text-muted-foreground hover:text-destructive transition-colors duration-150">
              <LogOut className="h-4 w-4 opacity-60" />
              {!collapsed && <span className="text-[13px]">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
