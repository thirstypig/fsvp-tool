import { DocumentUpload } from "../DocumentUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DocumentUploadExample() {
  const mockFiles = [
    {
      id: "1",
      name: "FDA_Certificate_2024.pdf",
      size: "2.4 MB",
      type: "application/pdf",
      uploadedAt: new Date().toISOString(),
      version: "v1.0.0",
    },
  ];

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload Compliance Documents</CardTitle>
          <CardDescription>
            Upload all required FDA compliance documents for your product SKU
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUpload 
            uploadedFiles={mockFiles}
            onUpload={(files) => console.log("Files uploaded:", files)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
