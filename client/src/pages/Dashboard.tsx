import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VendorDashboard } from "@/components/VendorDashboard";
import { DistributorDashboard } from "@/components/DistributorDashboard";
import { AuditorDashboard } from "@/components/AuditorDashboard";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type UserRole = "vendor" | "distributor" | "auditor";

interface DashboardProps {
  role: UserRole;
  userName?: string;
  onLogout?: () => void;
}

export default function Dashboard({ role, userName = "Demo User", onLogout }: DashboardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      onLogout?.();
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message,
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  const renderDashboard = () => {
    switch (role) {
      case "vendor":
        return <VendorDashboard />;
      case "distributor":
        return <DistributorDashboard />;
      case "auditor":
        return <AuditorDashboard />;
      default:
        return <VendorDashboard />;
    }
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role={role} userName={userName} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b gap-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid="button-logout"
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-background">
            {renderDashboard()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
