import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, BarChart3 } from "lucide-react";

const mockCampaigns = [
  {
    id: "1",
    name: "Q1 Real Estate Outreach",
    status: "active",
    sent: 2340,
    openRate: 34.2,
    replyRate: 8.1,
    bounceRate: 2.3,
    meetings: 12,
    dailyLimit: 500,
  },
  {
    id: "2",
    name: "Tech Founders Series",
    status: "active",
    sent: 1890,
    openRate: 41.5,
    replyRate: 12.3,
    bounceRate: 1.8,
    meetings: 18,
    dailyLimit: 300,
  },
  {
    id: "3",
    name: "Healthcare Decision Makers",
    status: "paused",
    sent: 890,
    openRate: 28.7,
    replyRate: 5.2,
    bounceRate: 3.1,
    meetings: 4,
    dailyLimit: 200,
  },
  {
    id: "4",
    name: "SaaS Growth Campaign",
    status: "draft",
    sent: 0,
    openRate: 0,
    replyRate: 0,
    bounceRate: 0,
    meetings: 0,
    dailyLimit: 400,
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "active": return <Badge className="bg-success text-success-foreground">Active</Badge>;
    case "paused": return <Badge className="bg-warning text-warning-foreground">Paused</Badge>;
    case "draft": return <Badge variant="secondary">Draft</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export default function Campaigns() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Manage your outreach campaigns</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="grid gap-4">
        {mockCampaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Daily limit: {campaign.dailyLimit} emails
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {campaign.status === "active" ? (
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-1" /> Pause
                    </Button>
                  ) : campaign.status !== "draft" ? (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-1" /> Resume
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {campaign.sent > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <div>
                    <div className="text-2xl font-bold">{campaign.sent.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{campaign.openRate}%</div>
                    <div className="text-xs text-muted-foreground">Open Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{campaign.replyRate}%</div>
                    <div className="text-xs text-muted-foreground">Reply Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{campaign.bounceRate}%</div>
                    <div className="text-xs text-muted-foreground">Bounce Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{campaign.meetings}</div>
                    <div className="text-xs text-muted-foreground">Meetings</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
