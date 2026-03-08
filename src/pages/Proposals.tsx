import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Proposals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Proposal Management</h1>
        <p className="text-muted-foreground">Create, store, and share proposals with clients</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Proposal management coming soon. You'll store proposals and share them with one click.</p>
        </CardContent>
      </Card>
    </div>
  );
}
