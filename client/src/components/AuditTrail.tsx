import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  FileUp, 
  FileCheck, 
  FileX, 
  Shield, 
  Edit, 
  Trash2 
} from "lucide-react";

type AuditAction = "upload" | "approve" | "reject" | "sign" | "edit" | "delete";

interface AuditEntry {
  id: string;
  action: AuditAction;
  user: string;
  role: string;
  timestamp: string;
  description: string;
  version?: string;
  changes?: string;
}

interface AuditTrailProps {
  entries: AuditEntry[];
}

const actionConfig = {
  upload: { icon: FileUp, color: "text-blue-600 dark:text-blue-400" },
  approve: { icon: FileCheck, color: "text-green-600 dark:text-green-400" },
  reject: { icon: FileX, color: "text-red-600 dark:text-red-400" },
  sign: { icon: Shield, color: "text-purple-600 dark:text-purple-400" },
  edit: { icon: Edit, color: "text-amber-600 dark:text-amber-400" },
  delete: { icon: Trash2, color: "text-gray-600 dark:text-gray-400" },
};

export function AuditTrail({ entries }: AuditTrailProps) {
  return (
    <div className="space-y-0">
      {entries.map((entry, index) => {
        const config = actionConfig[entry.action];
        const Icon = config.icon;
        const isLast = index === entries.length - 1;
        const initials = entry.user
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div key={entry.id} className="relative pl-8 pb-8" data-testid={`audit-entry-${entry.id}`}>
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
            )}
            <div className={`absolute left-0 top-1 p-1.5 rounded-full bg-background border-2 ${config.color} border-current`}>
              <Icon className="h-3 w-3" />
            </div>
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{entry.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {entry.user} • {entry.role}
                    </span>
                  </div>
                  {entry.version && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Version: <span className="font-mono">{entry.version}</span>
                    </p>
                  )}
                  {entry.changes && (
                    <p className="text-xs text-muted-foreground mt-1">{entry.changes}</p>
                  )}
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {entry.timestamp}
                </time>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
