import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserPlus, Mail, FileText, Briefcase, Megaphone, FolderKanban } from "lucide-react";

const actions = [
  { label: "Add Lead", icon: UserPlus, path: "/leads" },
  { label: "Send Email", icon: Mail, path: "/campaigns" },
  { label: "Create Proposal", icon: FileText, path: "/proposals" },
  { label: "Create Client", icon: Briefcase, path: "/clients" },
  { label: "Start Campaign", icon: Megaphone, path: "/campaigns" },
  { label: "Add Project", icon: FolderKanban, path: "/projects" },
];

export function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <Button
          key={a.label}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => navigate(a.path)}
        >
          <a.icon className="h-3.5 w-3.5" />
          {a.label}
        </Button>
      ))}
    </div>
  );
}
