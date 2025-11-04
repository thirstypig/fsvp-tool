import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUpload } from "./DocumentUpload";

interface SKUFormData {
  skuNumber: string;
  productName: string;
  category: string;
  description: string;
  manufacturer: string;
  country: string;
  ingredientsList: string;
  allergenInfo: string;
}

interface SKUFormProps {
  onSubmit?: (data: SKUFormData) => void;
  initialData?: Partial<SKUFormData>;
}

export function SKUForm({ onSubmit, initialData }: SKUFormProps) {
  const [formData, setFormData] = useState<SKUFormData>({
    skuNumber: initialData?.skuNumber || "",
    productName: initialData?.productName || "",
    category: initialData?.category || "",
    description: initialData?.description || "",
    manufacturer: initialData?.manufacturer || "",
    country: initialData?.country || "",
    ingredientsList: initialData?.ingredientsList || "",
    allergenInfo: initialData?.allergenInfo || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
    console.log("Form submitted:", formData);
  };

  const handleChange = (field: keyof SKUFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="skuNumber">SKU Number *</Label>
              <Input
                id="skuNumber"
                value={formData.skuNumber}
                onChange={(e) => handleChange("skuNumber", e.target.value)}
                placeholder="SKU-2024-XXX"
                required
                data-testid="input-sku-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => handleChange("productName", e.target.value)}
                placeholder="Enter product name"
                required
                data-testid="input-product-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger id="category" data-testid="select-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="cosmetics">Cosmetics</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Product Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Detailed product description..."
              rows={4}
              required
              data-testid="input-description"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manufacturer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer Name *</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleChange("manufacturer", e.target.value)}
                placeholder="Manufacturer company name"
                required
                data-testid="input-manufacturer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country of Origin *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                placeholder="Country"
                required
                data-testid="input-country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FDA Compliance Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients List</Label>
            <Textarea
              id="ingredients"
              value={formData.ingredientsList}
              onChange={(e) => handleChange("ingredientsList", e.target.value)}
              placeholder="List all ingredients..."
              rows={3}
              data-testid="input-ingredients"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergens">Allergen Information</Label>
            <Textarea
              id="allergens"
              value={formData.allergenInfo}
              onChange={(e) => handleChange("allergenInfo", e.target.value)}
              placeholder="List any allergen information..."
              rows={3}
              data-testid="input-allergens"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supporting Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUpload />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline"
          data-testid="button-save-draft"
        >
          Save Draft
        </Button>
        <Button 
          type="submit"
          data-testid="button-submit-sku"
        >
          Submit for Review
        </Button>
      </div>
    </form>
  );
}
