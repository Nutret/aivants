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

const dailyData = [
  { date: "Mar 1", sent: 450, opens: 148, replies: 32 },
  { date: "Mar 2", sent: 520, opens: 175, replies: 41 },
  { date: "Mar 3", sent: 480, opens: 156, replies: 28 },
  { date: "Mar 4", sent: 610, opens: 215, replies: 55 },
  { date: "Mar 5", sent: 590, opens: 198, replies: 48 },
  { date: "Mar 6", sent: 320, opens: 102, replies: 18 },
  { date: "Mar 7", sent: 280, opens: 88, replies: 14 },
];

const campaignPerformance = [
  { name: "Q1 Real Estate", opens: 34.2, replies: 8.1 },
  { name: "Tech Founders", opens: 41.5, replies: 12.3 },
  { name: "Healthcare DM", opens: 28.7, replies: 5.2 },
  { name: "SaaS Growth", opens: 38.9, replies: 9.8 },
];

const lineConfig: ChartConfig = {
  sent: { label: "Sent", color: "hsl(var(--chart-1))" },
  opens: { label: "Opens", color: "hsl(var(--chart-2))" },
  replies: { label: "Replies", color: "hsl(var(--chart-3))" },
};

const barConfig: ChartConfig = {
  opens: { label: "Open Rate %", color: "hsl(var(--chart-1))" },
  replies: { label: "Reply Rate %", color: "hsl(var(--chart-2))" },
};

const summaryStats = [
  { label: "Total Sent", value: "12,450" },
  { label: "Avg Open Rate", value: "33.8%" },
  { label: "Avg Reply Rate", value: "8.4%" },
  { label: "Bounce Rate", value: "2.1%" },
  { label: "Meetings Booked", value: "47" },
  { label: "Clients Won", value: "12" },
];

export default function Analytics() {
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

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barConfig} className="h-[300px] w-full">
              <BarChart data={campaignPerformance} layout="vertical">
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
      </div>
    </div>
  );
}
