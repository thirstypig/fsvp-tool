import { AuditTrail } from "../AuditTrail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditTrailExample() {
  const mockEntries = [
    {
      id: "1",
      action: "upload" as const,
      user: "John Smith",
      role: "Vendor",
      timestamp: "2024-10-15 14:30",
      description: "Uploaded product documentation (v1.0.0)",
      version: "v1.0.0",
      changes: "Initial submission with 5 compliance documents",
    },
    {
      id: "2",
      action: "approve" as const,
      user: "Sarah Johnson",
      role: "Distributor",
      timestamp: "2024-10-16 09:15",
      description: "Approved SKU for distribution",
      version: "v1.0.0",
    },
    {
      id: "3",
      action: "sign" as const,
      user: "Michael Chen",
      role: "FDA Auditor",
      timestamp: "2024-10-16 11:45",
      description: "Digital signature applied to compliance records",
      version: "v1.0.0",
    },
    {
      id: "4",
      action: "edit" as const,
      user: "John Smith",
      role: "Vendor",
      timestamp: "2024-10-17 08:20",
      description: "Updated product specifications",
      version: "v1.1.0",
      changes: "Modified ingredient list and allergen information",
    },
  ];

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail - SKU-2024-001</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTrail entries={mockEntries} />
        </CardContent>
      </Card>
    </div>
  );
}
