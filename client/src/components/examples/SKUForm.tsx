import { SKUForm } from "../SKUForm";

export default function SKUFormExample() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create New Product SKU</h1>
        <p className="text-muted-foreground mt-1">
          Complete all required fields for FDA compliance
        </p>
      </div>
      <SKUForm onSubmit={(data) => console.log("Form submitted:", data)} />
    </div>
  );
}
