import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar, Clock, Mail, Pause, Play, SkipForward, Trash2, Plus, User,
  AlertCircle, CheckCircle2, CalendarClock, Loader2, Send, CreditCard,
  ArrowRight, Edit2, Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, isToday, isFuture, addDays, parseISO } from "date-fns";

interface FollowUpItem {
  id: string;
  lead_id: string;
  sequence_id: string;
  campaign_id: string | null;
  current_step: number;
  status: string;
  next_followup_date: string | null;
  last_email_sent_at: string | null;
  followup_type: string;
  scheduled_date: string | null;
  condition_stop_on: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Joined
  lead?: { first_name: string; last_name: string | null; email: string; company_name: string | null };
  sequence?: { name: string; followup_type: string };
}

interface Lead { id: string; first_name: string; last_name: string | null; email: string; company_name: string | null; }
interface Sequence { id: string; name: string; followup_type: string; }

const TYPE_COLORS: Record<string, string> = {
  sales: "bg-primary/10 text-primary",
  nurturing: "bg-accent/10 text-accent",
  payment_reminder: "bg-warning/10 text-warning",
  check_in: "bg-chart-4/10 text-chart-4",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  active: Play,
  paused: Pause,
  completed: CheckCircle2,
  replied: Mail,
};

export default function FollowUps() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followups, setFollowups] = useState<FollowUpItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("today");

  // Schedule dialog
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedLeadId, setSchedLeadId] = useState("");
  const [schedSequenceId, setSchedSequenceId] = useState("");
  const [schedType, setSchedType] = useState("sales");
  const [schedDate, setSchedDate] = useState("");
  const [schedCondition, setSchedCondition] = useState("none");
  const [saving, setSaving] = useState(false);

  // Reschedule dialog
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const [fuRes, leadsRes, seqRes] = await Promise.all([
      supabase
        .from("followup_status")
        .select("*, leads(first_name, last_name, email, company_name), followup_sequences(name, followup_type)")
        .eq("user_id", user.id)
        .order("next_followup_date", { ascending: true }),
      supabase.from("leads").select("id, first_name, last_name, email, company_name").eq("user_id", user.id),
      supabase.from("followup_sequences").select("id, name, followup_type").eq("user_id", user.id),
    ]);

    const items = (fuRes.data || []).map((item: any) => ({
      ...item,
      lead: item.leads,
      sequence: item.followup_sequences,
    }));
    setFollowups(items);
    setLeads((leadsRes.data || []) as Lead[]);
    setSequences((seqRes.data || []) as Sequence[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const todayItems = followups.filter(f => f.status === "active" && f.next_followup_date && isToday(parseISO(f.next_followup_date)));
  const overdueItems = followups.filter(f => f.status === "active" && f.next_followup_date && isPast(parseISO(f.next_followup_date)) && !isToday(parseISO(f.next_followup_date)));
  const upcomingItems = followups.filter(f => f.status === "active" && f.next_followup_date && isFuture(parseISO(f.next_followup_date)) && !isToday(parseISO(f.next_followup_date)));
  const completedItems = followups.filter(f => ["completed", "replied"].includes(f.status));
  const pausedItems = followups.filter(f => f.status === "paused");

  const handlePause = async (id: string) => {
    const { error } = await supabase.from("followup_status").update({ status: "paused", updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Follow-up paused" });
    fetchAll();
  };

  const handleResume = async (id: string) => {
    const { error } = await supabase.from("followup_status").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Follow-up resumed" });
    fetchAll();
  };

  const handleSkip = async (item: FollowUpItem) => {
    // Advance to next step and recalculate date
    const nextStep = item.current_step + 1;
    const { data: stepData } = await supabase
      .from("followup_steps")
      .select("step_number, delay_days")
      .eq("sequence_id", item.sequence_id)
      .gt("step_number", nextStep)
      .order("step_number", { ascending: true })
      .limit(1)
      .maybeSingle();

    const nextDate = stepData
      ? addDays(new Date(), stepData.delay_days).toISOString()
      : null;

    const { error } = await supabase.from("followup_status").update({
      current_step: nextStep,
      next_followup_date: nextDate,
      updated_at: new Date().toISOString(),
      ...(nextDate ? {} : { status: "completed" }),
    }).eq("id", item.id);

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: nextDate ? "Step skipped" : "Sequence completed (no more steps)" });
    fetchAll();
  };

  const handleReschedule = async () => {
    if (!rescheduleId || !newDate) return;
    const { error } = await supabase.from("followup_status").update({
      next_followup_date: new Date(newDate).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", rescheduleId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Follow-up rescheduled" });
    setRescheduleId(null);
    setNewDate("");
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("followup_status").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Follow-up deleted" });
    setDeleteId(null);
    fetchAll();
  };

  const handleSchedule = async () => {
    if (!user || !schedLeadId || !schedSequenceId) return;
    setSaving(true);

    const seq = sequences.find(s => s.id === schedSequenceId);
    const firstStepDate = schedDate
      ? new Date(schedDate).toISOString()
      : new Date().toISOString();

    const { error } = await supabase.from("followup_status").insert({
      user_id: user.id,
      lead_id: schedLeadId,
      sequence_id: schedSequenceId,
      followup_type: schedType,
      next_followup_date: firstStepDate,
      scheduled_date: schedDate ? new Date(schedDate).toISOString() : null,
      condition_stop_on: schedCondition === "none" ? null : schedCondition,
      status: "active",
      current_step: 0,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Follow-up scheduled!" });
      setScheduleOpen(false);
      setSchedLeadId("");
      setSchedSequenceId("");
      setSchedType("sales");
      setSchedDate("");
      setSchedCondition("none");
    }
    setSaving(false);
    fetchAll();
  };

  const renderItem = (item: FollowUpItem) => {
    const leadName = item.lead ? `${item.lead.first_name} ${item.lead.last_name || ""}`.trim() : "Unknown";
    const company = item.lead?.company_name;
    const seqName = item.sequence?.name || "—";
    const type = item.followup_type || item.sequence?.followup_type || "sales";
    const StatusIcon = STATUS_ICONS[item.status] || Clock;
    const isOverdue = item.next_followup_date && isPast(parseISO(item.next_followup_date)) && !isToday(parseISO(item.next_followup_date));

    return (
      <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
            {type === "payment_reminder" ? <CreditCard className="h-4 w-4 text-warning" /> : <User className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{leadName}</span>
              {company && <span className="text-sm text-muted-foreground">— {company}</span>}
              <Badge variant="outline" className={TYPE_COLORS[type] || ""}>{type.replace("_", " ")}</Badge>
              {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.next_followup_date
                  ? format(parseISO(item.next_followup_date), "MMM d, yyyy")
                  : "No date"}
              </span>
              <span>Step {item.current_step + 1}</span>
              <span>{seqName}</span>
              {item.condition_stop_on && (
                <span className="flex items-center gap-1 text-xs text-accent">
                  <Bell className="h-3 w-3" />
                  Stop on: {item.condition_stop_on}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {item.status === "active" && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePause(item.id)} title="Pause">
                <Pause className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSkip(item)} title="Skip step">
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setRescheduleId(item.id); setNewDate(""); }} title="Reschedule">
                <CalendarClock className="h-4 w-4" />
              </Button>
            </>
          )}
          {item.status === "paused" && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleResume(item.id)} title="Resume">
              <Play className="h-4 w-4 text-success" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(item.id)} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  };

  const renderList = (items: FollowUpItem[], emptyMsg: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>{emptyMsg}</p>
        </div>
      );
    }
    return <div className="space-y-2">{items.map(renderItem)}</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Follow-Ups</h1>
          <p className="text-muted-foreground">Manage scheduled follow-ups, reminders, and nurturing sequences</p>
        </div>
        <Button onClick={() => setScheduleOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Follow-Up
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Today", count: todayItems.length, icon: CalendarClock, color: "text-primary" },
          { label: "Overdue", count: overdueItems.length, icon: AlertCircle, color: "text-destructive" },
          { label: "Upcoming", count: upcomingItems.length, icon: Clock, color: "text-muted-foreground" },
          { label: "Paused", count: pausedItems.length, icon: Pause, color: "text-warning" },
          { label: "Completed", count: completedItems.length, icon: CheckCircle2, color: "text-success" },
        ].map(s => (
          <Card key={s.label} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setTab(s.label.toLowerCase())}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading follow-ups…
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="today">Today ({todayItems.length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overdueItems.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingItems.length})</TabsTrigger>
            <TabsTrigger value="paused">Paused ({pausedItems.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">{renderList(todayItems, "No follow-ups scheduled for today")}</TabsContent>
          <TabsContent value="overdue" className="mt-4">{renderList(overdueItems, "No overdue follow-ups — you're all caught up!")}</TabsContent>
          <TabsContent value="upcoming" className="mt-4">{renderList(upcomingItems, "No upcoming follow-ups scheduled")}</TabsContent>
          <TabsContent value="paused" className="mt-4">{renderList(pausedItems, "No paused follow-ups")}</TabsContent>
          <TabsContent value="completed" className="mt-4">{renderList(completedItems, "No completed follow-ups yet")}</TabsContent>
        </Tabs>
      )}

      {/* Schedule Follow-Up Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Follow-Up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lead *</Label>
              <Select value={schedLeadId} onValueChange={setSchedLeadId}>
                <SelectTrigger><SelectValue placeholder="Select a lead" /></SelectTrigger>
                <SelectContent>
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.first_name} {l.last_name || ""} {l.company_name ? `(${l.company_name})` : ""} — {l.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sequence *</Label>
              <Select value={schedSequenceId} onValueChange={setSchedSequenceId}>
                <SelectTrigger><SelectValue placeholder="Select a sequence" /></SelectTrigger>
                <SelectContent>
                  {sequences.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={schedType} onValueChange={setSchedType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Follow-Up</SelectItem>
                    <SelectItem value="nurturing">Lead Nurturing</SelectItem>
                    <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                    <SelectItem value="check_in">Client Check-In</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} />
                <p className="text-xs text-muted-foreground">Leave blank to start immediately</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Auto-Stop Condition</Label>
              <Select value={schedCondition} onValueChange={setSchedCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No condition</SelectItem>
                  <SelectItem value="reply">Stop on reply</SelectItem>
                  <SelectItem value="meeting_booked">Stop on meeting booked</SelectItem>
                  <SelectItem value="payment_completed">Stop on payment completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={saving || !schedLeadId || !schedSequenceId}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarClock className="h-4 w-4 mr-2" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleId} onOpenChange={open => !open && setRescheduleId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule Follow-Up</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>New Date</Label>
            <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleId(null)}>Cancel</Button>
            <Button onClick={handleReschedule} disabled={!newDate}>Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete follow-up?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this follow-up from the schedule.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
