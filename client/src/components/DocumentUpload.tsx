import { useState } from "react";
import { Upload, FileText, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  version: string;
}

interface DocumentUploadProps {
  onUpload?: (files: File[]) => void;
  uploadedFiles?: UploadedFile[];
}

export function DocumentUpload({ onUpload, uploadedFiles = [] }: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>(uploadedFiles);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files).map((file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
        version: "v1.0.0",
      }));
      setFiles([...files, ...newFiles]);
      onUpload?.(Array.from(e.dataTransfer.files));
      console.log("Files uploaded:", newFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files).map((file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
        version: "v1.0.0",
      }));
      setFiles([...files, ...newFiles]);
      onUpload?.(Array.from(e.target.files));
      console.log("Files uploaded:", newFiles);
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    console.log("File removed:", id);
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        data-testid="dropzone-upload"
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Supported: PDF, DOCX, XLSX (Max 10MB per file)
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          data-testid="input-file-upload"
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById("file-upload")?.click()}
          data-testid="button-browse-files"
        >
          Browse Files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({files.length})</h4>
          {files.map((file) => (
            <Card key={file.id} className="p-4" data-testid={`file-item-${file.id}`}>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeFile(file.id)}
                      data-testid={`button-remove-${file.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span className="font-mono">{file.version}</span>
                    <span>•</span>
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
