import { StatCard } from "./StatCard";
import { VendorTable } from "./VendorTable";
import { SKUTable } from "./SKUTable";
import { Users, Package, History, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product, Vendor, AuditLog } from "@shared/schema";

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export function AuditorDashboard() {
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: auditData, isLoading: auditLoading } = useQuery<AuditLogsResponse>({
    queryKey: ["/api/audit/logs?limit=100"],
  });

  const isLoading = vendorsLoading || productsLoading || auditLoading;

  const vendorProductCounts = vendors.reduce((acc, vendor) => {
    acc[vendor.id] = {
      total: products.filter(p => p.vendorId === vendor.id).length,
      approved: products.filter(p => p.vendorId === vendor.id && p.status === "approved").length,
    };
    return acc;
  }, {} as Record<string, { total: number; approved: number }>);

  const vendorsData = vendors.slice(0, 10).map(vendor => ({
    id: vendor.id,
    name: vendor.companyName,
    country: vendor.country,
    email: `vendor-${vendor.id}@example.com`,
    totalSKUs: vendorProductCounts[vendor.id]?.total || 0,
    approvedSKUs: vendorProductCounts[vendor.id]?.approved || 0,
    verificationStatus: vendor.verificationStatus as "verified" | "pending" | "unverified",
    lastSubmission: vendor.lastSubmissionDate ? new Date(vendor.lastSubmissionDate).toISOString().split('T')[0] : "",
  }));

  const skusData = products.slice(0, 10).map(product => {
    const vendor = vendors.find(v => v.id === product.vendorId);
    return {
      id: product.id,
      skuNumber: product.skuNumber,
      productName: product.productName,
      vendor: vendor?.companyName || "",
      category: product.category,
      status: product.status as "draft" | "pending" | "approved" | "rejected",
      submittedDate: product.submittedAt ? new Date(product.submittedAt).toISOString().split('T')[0] : "",
      version: product.version,
    };
  });

  const rejectedProducts = products.filter(p => p.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">FDA Auditor Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          System-wide compliance oversight and audit trail access
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-32" data-testid="skeleton-stats" />
            <Skeleton className="h-32" data-testid="skeleton-stats" />
            <Skeleton className="h-32" data-testid="skeleton-stats" />
            <Skeleton className="h-32" data-testid="skeleton-stats" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Vendors"
              value={vendors.length}
              icon={Users}
              description="All registered vendors"
            />
            <StatCard
              title="Total SKUs"
              value={products.length}
              icon={Package}
              description="All product SKUs"
            />
            <StatCard
              title="Audit Entries"
              value={auditData?.total || 0}
              icon={History}
              description="Total audit records"
            />
            <StatCard
              title="Compliance Issues"
              value={rejectedProducts}
              icon={ShieldAlert}
              description="Requiring attention"
            />
          </>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors, SKUs, or audit records..."
          className="pl-10"
          data-testid="input-search-audit"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Complete visibility into all vendors and products</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="vendors">
            <TabsList>
              <TabsTrigger value="vendors" data-testid="tab-vendors">
                All Vendors
              </TabsTrigger>
              <TabsTrigger value="skus" data-testid="tab-skus">
                All SKUs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="vendors" className="mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                </div>
              ) : (
                <VendorTable 
                  vendors={vendorsData}
                  onView={(id) => console.log("View vendor:", id)}
                />
              )}
            </TabsContent>
            <TabsContent value="skus" className="mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                </div>
              ) : (
                <SKUTable 
                  skus={skusData}
                  onView={(id) => console.log("View SKU:", id)}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
