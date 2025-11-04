import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Download, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ComplianceStatus = "approved" | "pending" | "rejected" | "draft";

interface SKU {
  id: string;
  skuNumber: string;
  productName: string;
  vendor: string;
  category: string;
  status: ComplianceStatus;
  submittedDate: string;
  version: string;
}

interface SKUTableProps {
  skus: SKU[];
  showVendor?: boolean;
  onView?: (id: string) => void;
}

export function SKUTable({ skus, showVendor = true, onView }: SKUTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU Number</TableHead>
            <TableHead>Product Name</TableHead>
            {showVendor && <TableHead>Vendor</TableHead>}
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Version</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skus.map((sku) => (
            <TableRow key={sku.id} data-testid={`row-sku-${sku.id}`}>
              <TableCell className="font-mono text-sm">{sku.skuNumber}</TableCell>
              <TableCell className="font-medium">{sku.productName}</TableCell>
              {showVendor && <TableCell>{sku.vendor}</TableCell>}
              <TableCell>{sku.category}</TableCell>
              <TableCell>
                <StatusBadge status={sku.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {sku.submittedDate}
              </TableCell>
              <TableCell className="font-mono text-sm">{sku.version}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView?.(sku.id)}
                    data-testid={`button-view-${sku.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-actions-${sku.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download Documents
                      </DropdownMenuItem>
                      <DropdownMenuItem>View Audit Trail</DropdownMenuItem>
                      <DropdownMenuItem>Export Data</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
