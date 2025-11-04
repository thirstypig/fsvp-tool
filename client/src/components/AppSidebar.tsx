import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Package, 
  Upload, 
  Users, 
  FileCheck, 
  ShieldCheck,
  History,
  Settings
} from "lucide-react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type UserRole = "vendor" | "distributor" | "auditor";

interface AppSidebarProps {
  role: UserRole;
  userName?: string;
}

const menuItems = {
  vendor: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "My Products", url: "/products", icon: Package },
    { title: "Upload Documents", url: "/upload", icon: Upload },
    { title: "Submission History", url: "/history", icon: History },
  ],
  distributor: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Vendor Directory", url: "/vendors", icon: Users },
    { title: "SKU Review Queue", url: "/review", icon: FileCheck },
    { title: "Approved Products", url: "/approved", icon: ShieldCheck },
  ],
  auditor: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "All Vendors", url: "/vendors", icon: Users },
    { title: "All SKUs", url: "/skus", icon: Package },
    { title: "Audit Log", url: "/audit", icon: History },
    { title: "Compliance Reports", url: "/reports", icon: FileCheck },
  ],
};

export function AppSidebar({ role, userName = "User" }: AppSidebarProps) {
  const [location] = useLocation();
  const items = menuItems[role];

  const roleLabels = {
    vendor: "Vendor Portal",
    distributor: "Distributor Portal",
    auditor: "FDA Auditor Portal",
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">FSVP Platform</h2>
            <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
