import { StatCard } from "../StatCard";
import { Package, CheckCircle2, Clock } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="p-6 grid gap-4 md:grid-cols-3 max-w-5xl">
      <StatCard
        title="Total SKUs"
        value={24}
        icon={Package}
        description="All product SKUs"
      />
      <StatCard
        title="Approved"
        value={20}
        icon={CheckCircle2}
        description="Compliance approved"
        trend={{ value: "12.5%", isPositive: true }}
      />
      <StatCard
        title="Under Review"
        value={3}
        icon={Clock}
        description="Pending approval"
        trend={{ value: "2 new", isPositive: false }}
      />
    </div>
  );
}
