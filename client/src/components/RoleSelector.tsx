import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, ShieldCheck } from "lucide-react";

type UserRole = "vendor" | "distributor" | "auditor";

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
}

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  const roles = [
    {
      id: "vendor" as const,
      title: "Vendor Portal",
      description: "Create and manage product SKUs, upload compliance documents",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "distributor" as const,
      title: "Distributor Portal",
      description: "Review vendor submissions and approve product SKUs",
      icon: Building2,
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "auditor" as const,
      title: "FDA Auditor Portal",
      description: "System-wide oversight, audit trails, and compliance reports",
      icon: ShieldCheck,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">FSVP Compliance Platform</h1>
          <p className="text-lg text-muted-foreground">
            Foreign Supplier Verification Program
          </p>
          <p className="text-sm text-muted-foreground">
            Select your role to access the platform
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card 
                key={role.id}
                className="hover-elevate transition-all cursor-pointer"
                onClick={() => onSelectRole(role.id)}
                data-testid={`card-role-${role.id}`}
              >
                <CardHeader>
                  <div className={`mb-2 ${role.color}`}>
                    <Icon className="h-10 w-10" />
                  </div>
                  <CardTitle>{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" data-testid={`button-select-${role.id}`}>
                    Access Portal
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
