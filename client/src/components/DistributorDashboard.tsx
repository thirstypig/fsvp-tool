import { StatCard } from "./StatCard";
import { SKUTable } from "./SKUTable";
import { Users, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product, Vendor } from "@shared/schema";

export function DistributorDashboard() {
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: pendingProducts = [], isLoading: pendingLoading } = useQuery<Product[]>({
    queryKey: ["/api/products?status=pending"],
  });

  const { data: approvedProducts = [], isLoading: approvedLoading } = useQuery<Product[]>({
    queryKey: ["/api/products?status=approved"],
  });

  const isLoading = vendorsLoading || pendingLoading || approvedLoading;

  const verifiedVendors = vendors.filter(v => v.verificationStatus === "verified").length;

  const pendingSKUs = pendingProducts.slice(0, 10).map(product => {
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

  const approvedSKUs = approvedProducts.slice(0, 10).map(product => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Distributor Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Review vendor submissions and manage product approvals
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
              title="Active Vendors"
              value={vendors.length}
              icon={Users}
              description="Registered vendors"
            />
            <StatCard
              title="Pending Review"
              value={pendingProducts.length}
              icon={Clock}
              description="Awaiting approval"
            />
            <StatCard
              title="Approved Products"
              value={approvedProducts.length}
              icon={CheckCircle2}
              description="Successfully reviewed"
            />
            <StatCard
              title="Verified Vendors"
              value={verifiedVendors}
              icon={ShieldCheck}
              description="Compliance verified"
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SKU Review Queue</CardTitle>
          <CardDescription>Review and approve vendor product submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending Review ({pendingSKUs.length})
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved">
                Approved ({approvedSKUs.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                </div>
              ) : (
                <SKUTable 
                  skus={pendingSKUs}
                  onView={(id) => console.log("View SKU:", id)}
                />
              )}
            </TabsContent>
            <TabsContent value="approved" className="mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                  <Skeleton className="h-10" data-testid="skeleton-table" />
                </div>
              ) : (
                <SKUTable 
                  skus={approvedSKUs}
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
