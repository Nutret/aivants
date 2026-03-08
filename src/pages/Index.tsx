import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, Megaphone, Mail, Eye, MessageSquare, Calendar, Trophy, TrendingUp,
} from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig: ChartConfig = {
  sent: { label: "Sent", color: "hsl(var(--chart-1))" },
  opened: { label: "Opened", color: "hsl(var(--chart-2))" },
};

export default function Index() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0, activeCampaigns: 0, emailsSentToday: 0,
    openRate: 0, replyRate: 0, meetingsBooked: 0, clientsWon: 0,
  });
  const [chartData, setChartData] = useState<{ day: string; sent: number; opened: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ action: string; detail: string; time: string }[]>([]);

  useEffect(() => {
    if (!user) return;

    async function fetchDashboard() {
      setLoading(true);

      const [
        { count: leadCount },
        { data: campaigns },
        { data: logs },
        { data: pipeline },
        { data: recentLeads },
      ] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("campaigns").select("id, status").eq("user_id", user!.id),
        supabase.from("email_logs").select("*").eq("user_id", user!.id),
        supabase.from("pipeline_stages").select("*").eq("user_id", user!.id),
        supabase.from("leads").select("first_name, last_name, company_name, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5),
      ]);

      const allLogs = logs || [];
      const allPipeline = pipeline || [];
      const allCampaigns = campaigns || [];

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const todayLogs = allLogs.filter((l) => l.sent_at && format(new Date(l.sent_at), "yyyy-MM-dd") === todayStr);
      const totalOpened = allLogs.filter((l) => l.opened_at).length;
      const totalReplied = allLogs.filter((l) => l.replied_at).length;
      const totalSent = allLogs.length;

      setStats({
        totalLeads: leadCount || 0,
        activeCampaigns: allCampaigns.filter((c) => c.status === "active").length,
        emailsSentToday: todayLogs.length,
        openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0,
        replyRate: totalSent > 0 ? Math.round((totalReplied / totalSent) * 1000) / 10 : 0,
        meetingsBooked: allPipeline.filter((p) => p.meeting_booked).length,
        clientsWon: allPipeline.filter((p) => p.client_won).length,
      });

      // Chart: last 7 days
      const daily: { day: string; sent: number; opened: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStr = format(day, "yyyy-MM-dd");
        const dayLabel = format(day, "EEE");
        const dayLogs = allLogs.filter((l) => l.sent_at && format(new Date(l.sent_at), "yyyy-MM-dd") === dayStr);
        daily.push({
          day: dayLabel,
          sent: dayLogs.length,
          opened: dayLogs.filter((l) => l.opened_at).length,
        });
      }
      setChartData(daily);

      // Recent activity from leads
      const activity = (recentLeads || []).map((lead) => ({
        action: "New lead added",
        detail: `${lead.first_name} ${lead.last_name || ""} from ${lead.company_name || "Unknown"}`.trim(),
        time: formatTimeAgo(new Date(lead.created_at)),
      }));
      setRecentActivity(activity);

      setLoading(false);
    }

    fetchDashboard();
  }, [user]);

  const statCards = [
    { label: "Total Leads", value: stats.totalLeads.toLocaleString(), icon: Users },
    { label: "Active Campaigns", value: stats.activeCampaigns.toString(), icon: Megaphone },
    { label: "Emails Sent Today", value: stats.emailsSentToday.toLocaleString(), icon: Mail },
    { label: "Open Rate", value: `${stats.openRate}%`, icon: Eye },
    { label: "Reply Rate", value: `${stats.replyRate}%`, icon: MessageSquare },
    { label: "Meetings Booked", value: stats.meetingsBooked.toString(), icon: Calendar },
    { label: "Clients Won", value: stats.clientsWon.toString(), icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your lead intelligence overview</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Campaign Performance (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sent" fill="var(--color-sent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="opened" fill="var(--color-opened)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="text-sm font-medium">{item.action}</div>
                    <div className="text-xs text-muted-foreground">{item.detail}</div>
                    <div className="text-xs text-muted-foreground/60">{item.time}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
