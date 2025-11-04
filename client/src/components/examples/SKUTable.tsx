import { SKUTable } from "../SKUTable";

export default function SKUTableExample() {
  const mockSKUs = [
    {
      id: "1",
      skuNumber: "SKU-2024-001",
      productName: "Organic Coffee Beans",
      vendor: "Global Imports Ltd",
      category: "Food & Beverage",
      status: "approved" as const,
      submittedDate: "2024-10-10",
      version: "v2.1.0",
    },
    {
      id: "2",
      skuNumber: "SKU-2024-002",
      productName: "Industrial Valves",
      vendor: "TechParts Inc",
      category: "Industrial",
      status: "pending" as const,
      submittedDate: "2024-10-15",
      version: "v1.0.0",
    },
    {
      id: "3",
      skuNumber: "SKU-2024-003",
      productName: "Dietary Supplements",
      vendor: "HealthCo International",
      category: "Healthcare",
      status: "rejected" as const,
      submittedDate: "2024-10-12",
      version: "v1.2.1",
    },
  ];

  return (
    <div className="p-6 max-w-7xl">
      <SKUTable 
        skus={mockSKUs} 
        onView={(id) => console.log("View SKU:", id)}
      />
    </div>
  );
}
