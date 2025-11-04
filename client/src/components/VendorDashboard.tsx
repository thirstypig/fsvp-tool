import { useEffect } from "react";
import { StatCard } from "./StatCard";
import { SKUTable } from "./SKUTable";
import { Package, CheckCircle2, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Product, Vendor } from "@shared/schema";

export function VendorDashboard() {
  const { toast } = useToast();

  const { data: vendor, isLoading: vendorLoading, error: vendorError } = useQuery<Vendor>({
    queryKey: ["/api/vendors/me"],
  });

  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ["/api/products/my"],
  });

  useEffect(() => {
    if (vendorError) {
      toast({
        variant: "destructive",
        title: "Error loading vendor profile",
        description: vendorError instanceof Error ? vendorError.message : "Failed to load vendor profile",
      });
    }
  }, [vendorError, toast]);

  useEffect(() => {
    if (productsError) {
      toast({
        variant: "destructive",
        title: "Error loading products",
        description: productsError instanceof Error ? productsError.message : "Failed to load products",
      });
    }
  }, [productsError, toast]);

  const isLoading = vendorLoading || productsLoading;

  const stats = {
    total: products.length,
    approved: products.filter(p => p.status === "approved").length,
    pending: products.filter(p => p.status === "pending").length,
    drafts: products.filter(p => p.status === "draft").length,
  };

  const recentProducts = products.slice(0, 10).map(product => ({
    id: product.id,
    skuNumber: product.skuNumber,
    productName: product.productName,
    vendor: vendor?.companyName || "",
    category: product.category,
    status: product.status as "draft" | "pending" | "approved" | "rejected",
    submittedDate: product.submittedAt ? new Date(product.submittedAt).toISOString().split('T')[0] : "",
    version: product.version,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Vendor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product SKUs and compliance documentation
          </p>
        </div>
        <Button data-testid="button-create-sku">
          <Plus className="h-4 w-4 mr-2" />
          Create New SKU
        </Button>
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
              title="Total SKUs"
              value={stats.total}
              icon={Package}
              description="All product SKUs"
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              icon={CheckCircle2}
              description="Compliance approved"
            />
            <StatCard
              title="Under Review"
              value={stats.pending}
              icon={Clock}
              description="Pending approval"
            />
            <StatCard
              title="Drafts"
              value={stats.drafts}
              icon={FileText}
              description="Not submitted"
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Your latest product SKU submissions and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10" data-testid="skeleton-table" />
              <Skeleton className="h-10" data-testid="skeleton-table" />
              <Skeleton className="h-10" data-testid="skeleton-table" />
            </div>
          ) : (
            <SKUTable 
              skus={recentProducts} 
              showVendor={false}
              onView={(id) => console.log("View SKU:", id)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
