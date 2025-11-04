import { VendorTable } from "../VendorTable";

export default function VendorTableExample() {
  const mockVendors = [
    {
      id: "1",
      name: "Global Imports Ltd",
      country: "China",
      email: "contact@globalimports.com",
      totalSKUs: 24,
      approvedSKUs: 20,
      verificationStatus: "verified" as const,
      lastSubmission: "2024-10-15",
    },
    {
      id: "2",
      name: "TechParts Inc",
      country: "Germany",
      email: "info@techparts.de",
      totalSKUs: 12,
      approvedSKUs: 8,
      verificationStatus: "pending" as const,
      lastSubmission: "2024-10-14",
    },
    {
      id: "3",
      name: "HealthCo International",
      country: "India",
      email: "support@healthco.in",
      totalSKUs: 8,
      approvedSKUs: 5,
      verificationStatus: "verified" as const,
      lastSubmission: "2024-10-12",
    },
  ];

  return (
    <div className="p-6 max-w-7xl">
      <VendorTable 
        vendors={mockVendors}
        onView={(id) => console.log("View vendor:", id)}
      />
    </div>
  );
}
