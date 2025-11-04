import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Vendor {
  id: string;
  name: string;
  country: string;
  email: string;
  totalSKUs: number;
  approvedSKUs: number;
  verificationStatus: "verified" | "pending" | "unverified";
  lastSubmission: string;
}

interface VendorTableProps {
  vendors: Vendor[];
  onView?: (id: string) => void;
}

export function VendorTable({ vendors, onView }: VendorTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Total SKUs</TableHead>
            <TableHead className="text-right">Approved</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Submission</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => {
            const initials = vendor.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <TableRow key={vendor.id} data-testid={`row-vendor-${vendor.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{vendor.name}</span>
                  </div>
                </TableCell>
                <TableCell>{vendor.country}</TableCell>
                <TableCell className="text-muted-foreground">{vendor.email}</TableCell>
                <TableCell className="text-right font-mono">{vendor.totalSKUs}</TableCell>
                <TableCell className="text-right font-mono">{vendor.approvedSKUs}</TableCell>
                <TableCell>
                  {vendor.verificationStatus === "verified" ? (
                    <Badge variant="outline" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      {vendor.verificationStatus === "pending" ? "Pending" : "Unverified"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {vendor.lastSubmission}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView?.(vendor.id)}
                    data-testid={`button-view-vendor-${vendor.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
