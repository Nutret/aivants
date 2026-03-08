import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const mockLeads = Array.from({ length: 25 }, (_, i) => ({
  id: `lead-${i + 1}`,
  first_name: ["John", "Sarah", "Mike", "Lisa", "James", "Emily"][i % 6],
  last_name: ["Smith", "Chen", "Johnson", "Wang", "Brown", "Davis"][i % 6],
  company_name: ["Alpha Realty", "Tech Corp", "Blue Sky Inc", "Green Energy", "DataFlow"][i % 5],
  email: `lead${i + 1}@example.com`,
  phone: `+1 555-${String(1000 + i).padStart(4, "0")}`,
  industry: ["Real Estate", "Technology", "Healthcare", "Energy", "Finance"][i % 5],
  location: ["New York", "San Francisco", "Chicago", "Austin", "Seattle"][i % 5],
  lead_score: Math.floor(Math.random() * 50) + 50,
  status: ["new", "contacted", "interested", "meeting"][i % 4] as string,
}));

function getScoreBadge(score: number) {
  if (score >= 90) return <Badge className="bg-success text-success-foreground">High</Badge>;
  if (score >= 70) return <Badge className="bg-warning text-warning-foreground">Medium</Badge>;
  return <Badge variant="secondary">Low</Badge>;
}

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    new: "bg-primary/10 text-primary",
    contacted: "bg-chart-3/10 text-warning",
    interested: "bg-success/10 text-success",
    meeting: "bg-chart-4/10 text-chart-4",
  };
  return (
    <Badge variant="outline" className={colors[status] || ""}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function Leads() {
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = mockLeads.filter((lead) => {
    const matchesSearch =
      !search ||
      `${lead.first_name} ${lead.last_name} ${lead.company_name} ${lead.email}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesIndustry = industryFilter === "all" || lead.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">Manage your lead database</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">All Leads ({filtered.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={industryFilter} onValueChange={(v) => { setIndustryFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden lg:table-cell">Industry</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {lead.first_name} {lead.last_name}
                  </TableCell>
                  <TableCell>{lead.company_name}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">{lead.industry}</TableCell>
                  <TableCell className="hidden md:table-cell">{lead.location}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{lead.lead_score}</span>
                      {getScoreBadge(lead.lead_score)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
