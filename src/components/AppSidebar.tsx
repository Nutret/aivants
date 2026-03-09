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
  Radio,
  Briefcase,
  FolderKanban,
  IndianRupee,
  UsersRound,
  Bot,
  BookOpen,
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

const commandItems = [
  { title: "Command Center", url: "/", icon: LayoutDashboard },
];

const leadItems = [
  { title: "Lead Categories", url: "/leads", icon: Users },
  { title: "All Leads", url: "/leads/all", icon: Users },
  { title: "Import Leads", url: "/import", icon: Upload },
];

const clientItems = [
  { title: "Clients", url: "/clients", icon: Briefcase },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Team Members", url: "/team", icon: UsersRound },
  { title: "Proposals", url: "/proposals", icon: FileText },
];

const outreachItems = [
  { title: "Campaigns", url: "/campaigns", icon: Megaphone },
  { title: "Scripts", url: "/scripts", icon: ScrollText },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Content", url: "/content", icon: FolderOpen },
  { title: "Sequences", url: "/sequences", icon: Clock },
  { title: "Follow-Ups", url: "/followups", icon: CalendarClock },
];

const insightItems = [
  { title: "Pipeline", url: "/pipeline", icon: Kanban },
  { title: "Revenue", url: "/revenue", icon: IndianRupee },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Orchestrator", url: "/orchestrator", icon: Radio },
];

const aiItems = [
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "Knowledge Base", url: "/knowledge-base", icon: BookOpen },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const renderGroup = (label: string, items: typeof commandItems) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="hover:bg-sidebar-accent"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
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
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          {collapsed ? (
            <img src="/logo.png" alt="Aivants" className="h-8 w-8 object-contain" />
          ) : (
            <img src="/logo.png" alt="Aivants" className="h-9 object-contain" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Home", commandItems)}
        {renderGroup("Lead Management", leadItems)}
        {renderGroup("Clients & Projects", clientItems)}
        {renderGroup("Outreach", outreachItems)}
        {renderGroup("Insights & Revenue", insightItems)}
        {renderGroup("AI", aiItems)}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink
                  to={item.url}
                  className="hover:bg-sidebar-accent"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="hover:bg-sidebar-accent text-destructive">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
