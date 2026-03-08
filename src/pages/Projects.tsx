import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

export default function Projects() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Project Management</h1>
        <p className="text-muted-foreground">Track projects, assign teams, manage deadlines & milestones</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Project management coming soon. You'll track projects, assign team members, and manage deadlines.</p>
        </CardContent>
      </Card>
    </div>
  );
}
