import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function Clients() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
        <p className="text-muted-foreground">Manage active clients, contracts, and communications</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Client management coming soon. You'll be able to track clients, contracts, and send updates.</p>
        </CardContent>
      </Card>
    </div>
  );
}
