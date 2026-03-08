import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface PipelineLead {
  id: string;
  name: string;
  company: string;
  score: number;
  stage: string;
}

const stages = [
  "New Lead",
  "Contacted",
  "Interested",
  "Meeting Scheduled",
  "Proposal Sent",
  "Client Won",
  "Client Lost",
];

const initialLeads: PipelineLead[] = [
  { id: "1", name: "John Smith", company: "Alpha Realty", score: 92, stage: "New Lead" },
  { id: "2", name: "Sarah Chen", company: "Tech Corp", score: 87, stage: "New Lead" },
  { id: "3", name: "Mike Johnson", company: "Blue Sky", score: 78, stage: "Contacted" },
  { id: "4", name: "Lisa Wang", company: "Green Energy", score: 95, stage: "Interested" },
  { id: "5", name: "James Brown", company: "DataFlow", score: 84, stage: "Meeting Scheduled" },
  { id: "6", name: "Emily Davis", company: "CloudNet", score: 71, stage: "Contacted" },
  { id: "7", name: "Robert Wilson", company: "AI Labs", score: 88, stage: "Proposal Sent" },
  { id: "8", name: "Amy Taylor", company: "FinVault", score: 93, stage: "Client Won" },
  { id: "9", name: "Daniel Lee", company: "MedPro", score: 65, stage: "Client Lost" },
  { id: "10", name: "Karen Martinez", company: "EduTech", score: 76, stage: "New Lead" },
];

function getScoreColor(score: number) {
  if (score >= 90) return "bg-success text-success-foreground";
  if (score >= 70) return "bg-warning text-warning-foreground";
  return "bg-muted text-muted-foreground";
}

const stageColors: Record<string, string> = {
  "New Lead": "border-t-primary",
  "Contacted": "border-t-chart-3",
  "Interested": "border-t-accent",
  "Meeting Scheduled": "border-t-chart-4",
  "Proposal Sent": "border-t-chart-1",
  "Client Won": "border-t-success",
  "Client Lost": "border-t-destructive",
};

export default function Pipeline() {
  const [leads] = useState<PipelineLead[]>(initialLeads);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">Track leads through your sales pipeline</p>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4" style={{ minWidth: stages.length * 260 }}>
          {stages.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="w-[250px] flex-shrink-0">
                <div className={`rounded-lg border border-t-4 ${stageColors[stage]} bg-card`}>
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{stage}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {stageLeads.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-2 space-y-2 min-h-[200px]">
                    {stageLeads.map((lead) => (
                      <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <div className="font-medium text-sm">{lead.name}</div>
                          <div className="text-xs text-muted-foreground">{lead.company}</div>
                          <div className="mt-2">
                            <Badge className={`text-xs ${getScoreColor(lead.score)}`}>
                              Score: {lead.score}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
