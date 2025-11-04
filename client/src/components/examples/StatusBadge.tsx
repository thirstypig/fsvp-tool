import { StatusBadge } from "../StatusBadge";

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-4 p-4">
      <StatusBadge status="approved" />
      <StatusBadge status="pending" />
      <StatusBadge status="rejected" />
      <StatusBadge status="draft" />
    </div>
  );
}
