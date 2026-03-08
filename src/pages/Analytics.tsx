import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyData {
  date: string;
  sent: number;
  opens: number;
  replies: number;
}

interface CampaignPerf {
  name: string;
  opens: number;
  replies: number;
}

interface SummaryStats {
  totalSent: number;
  avgOpenRate: number;
  avgReplyRate: number;
  bounceRate: number;
  meetingsBooked: number;
  clientsWon: number;
}

const lineConfig: ChartConfig = {
  sent: { label: "Sent", color: "hsl(var(--chart-1))" },
  opens: { label: "Opens", color: "hsl(var(--chart-2))" },
  replies: { label: "Replies", color: "hsl(var(--chart-3))" },
};

const barConfig: ChartConfig = {
  opens: { label: "Open Rate %", color: "hsl(var(--chart-1))" },
  replies: { label: "Reply Rate %", color: "hsl(var(--chart-2))" },
};

export default function Analytics() {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [campaignPerf, setCampaignPerf] = useState<CampaignPerf[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalSent: 0, avgOpenRate: 0, avgReplyRate: 0, bounceRate: 0, meetingsBooked: 0, clientsWon: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchAnalytics() {
      setLoading(true);

      // Fetch all email logs for the user
      const { data: logs } = await supabase
        .from("email_logs")
        .select("*, campaigns(name)")
        .eq("user_id", user!.id);

      // Fetch pipeline data
      const { data: pipeline } = await supabase
        .from("pipeline_stages")
        .select("*")
        .eq("user_id", user!.id);

      const allLogs = logs || [];
      const allPipeline = pipeline || [];

      // Summary stats
      const totalSent = allLogs.length;
      const totalOpened = allLogs.filter((l) => l.opened_at).length;
      const totalReplied = allLogs.filter((l) => l.replied_at).length;
      const totalBounced = allLogs.filter((l) => l.bounced).length;
      const meetingsBooked = allPipeline.filter((p) => p.meeting_booked).length;
      const clientsWon = allPipeline.filter((p) => p.client_won).length;

      setSummary({
        totalSent,
        avgOpenRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0,
        avgReplyRate: totalSent > 0 ? Math.round((totalReplied / totalSent) * 1000) / 10 : 0,
        bounceRate: totalSent > 0 ? Math.round((totalBounced / totalSent) * 1000) / 10 : 0,
        meetingsBooked,
        clientsWon,
      });

      // Daily data for last 7 days
      const daily: DailyData[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStr = format(day, "yyyy-MM-dd");
        const dayLabel = format(day, "MMM d");
        const dayLogs = allLogs.filter(
          (l) => l.sent_at && format(new Date(l.sent_at), "yyyy-MM-dd") === dayStr
        );
        daily.push({
          date: dayLabel,
          sent: dayLogs.length,
          opens: dayLogs.filter((l) => l.opened_at).length,
          replies: dayLogs.filter((l) => l.replied_at).length,
        });
      }
      setDailyData(daily);

      // Campaign performance
      const campaignMap = new Map<string, { sent: number; opened: number; replied: number }>();
      allLogs.forEach((log) => {
        const name = (log as any).campaigns?.name || "Unknown";
        if (!campaignMap.has(name)) campaignMap.set(name, { sent: 0, opened: 0, replied: 0 });
        const c = campaignMap.get(name)!;
        c.sent++;
        if (log.opened_at) c.opened++;
        if (log.replied_at) c.replied++;
      });

      const perfData: CampaignPerf[] = Array.from(campaignMap.entries())
        .filter(([name]) => name !== "Unknown")
        .map(([name, stats]) => ({
          name,
          opens: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 1000) / 10 : 0,
          replies: stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.opens - a.opens)
        .slice(0, 6);

      setCampaignPerf(perfData);
      setLoading(false);
    }

    fetchAnalytics();
  }, [user]);

  const summaryStats = [
    { label: "Total Sent", value: summary.totalSent.toLocaleString() },
    { label: "Avg Open Rate", value: `${summary.avgOpenRate}%` },
    { label: "Avg Reply Rate", value: `${summary.avgReplyRate}%` },
    { label: "Bounce Rate", value: `${summary.bounceRate}%` },
    { label: "Meetings Booked", value: summary.meetingsBooked.toString() },
    { label: "Clients Won", value: summary.clientsWon.toString() },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Campaign and engagement analytics</p>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const hasData = summary.totalSent > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Campaign and engagement analytics</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No email data yet. Start sending campaigns to see analytics here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sending Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={lineConfig} className="h-[300px] w-full">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="sent" stroke="var(--color-sent)" strokeWidth={2} />
                  <Line type="monotone" dataKey="opens" stroke="var(--color-opens)" strokeWidth={2} />
                  <Line type="monotone" dataKey="replies" stroke="var(--color-replies)" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {campaignPerf.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barConfig} className="h-[300px] w-full">
                  <BarChart data={campaignPerf} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="opens" fill="var(--color-opens)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="replies" fill="var(--color-replies)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
