import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Megaphone,
  Mail,
  Eye,
  MessageSquare,
  Calendar,
  Trophy,
  TrendingUp,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const stats = [
  { label: "Total Leads", value: "24,891", icon: Users, change: "+12%" },
  { label: "Active Campaigns", value: "8", icon: Megaphone, change: "+2" },
  { label: "Emails Sent Today", value: "1,247", icon: Mail, change: "+18%" },
  { label: "Open Rate", value: "32.4%", icon: Eye, change: "+2.1%" },
  { label: "Reply Rate", value: "8.7%", icon: MessageSquare, change: "+0.5%" },
  { label: "Meetings Booked", value: "14", icon: Calendar, change: "+3" },
  { label: "Clients Won", value: "6", icon: Trophy, change: "+1" },
];

const chartData = [
  { day: "Mon", sent: 890, opened: 312 },
  { day: "Tue", sent: 1200, opened: 410 },
  { day: "Wed", sent: 1050, opened: 356 },
  { day: "Thu", sent: 1340, opened: 478 },
  { day: "Fri", sent: 980, opened: 320 },
  { day: "Sat", sent: 450, opened: 145 },
  { day: "Sun", sent: 320, opened: 98 },
];

const chartConfig: ChartConfig = {
  sent: { label: "Sent", color: "hsl(var(--chart-1))" },
  opened: { label: "Opened", color: "hsl(var(--chart-2))" },
};

const recentActivity = [
  { action: "New lead imported", detail: "John Smith from Alpha Realty", time: "2 min ago" },
  { action: "Email opened", detail: "Sarah Chen opened campaign #12", time: "5 min ago" },
  { action: "Reply received", detail: "Mike Johnson replied to outreach", time: "12 min ago" },
  { action: "Meeting booked", detail: "Lisa Wang scheduled a demo", time: "1 hr ago" },
  { action: "Lead scored", detail: "Tech Corp scored 92/100", time: "2 hrs ago" },
];

export default function Index() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your lead intelligence overview</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-accent">{stat.change}</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{stat.value}</div>
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
              Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="text-sm font-medium">{item.action}</div>
                  <div className="text-xs text-muted-foreground">{item.detail}</div>
                  <div className="text-xs text-muted-foreground/60">{item.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
