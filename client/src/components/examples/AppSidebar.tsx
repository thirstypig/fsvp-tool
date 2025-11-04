import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "../AppSidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="vendor" userName="John Smith" />
        <main className="flex-1 p-8 bg-background">
          <div className="max-w-4xl">
            <h1 className="text-2xl font-semibold mb-4">Main Content Area</h1>
            <p className="text-muted-foreground">
              This is where the main content would appear. The sidebar shows vendor navigation.
            </p>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
