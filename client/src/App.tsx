import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import { RoleSelector } from "@/components/RoleSelector";

type UserRole = "vendor" | "distributor" | "auditor";

function App() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleLogout = () => {
    setSelectedRole(null);
  };

  const roleNames = {
    vendor: "Demo Vendor User",
    distributor: "Demo Distributor User",
    auditor: "Demo FDA Auditor",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!selectedRole ? (
          <RoleSelector onSelectRole={setSelectedRole} />
        ) : (
          <Dashboard 
            role={selectedRole} 
            userName={roleNames[selectedRole]}
            onLogout={handleLogout}
          />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
