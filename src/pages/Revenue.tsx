import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";

export default function Revenue() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revenue Dashboard</h1>
        <p className="text-muted-foreground">Financial overview — revenue, costs, profit & growth projections</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Revenue dashboard coming soon. Track client payments, team costs, subscriptions, and profit projections.</p>
        </CardContent>
      </Card>
    </div>
  );
}
