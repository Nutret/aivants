import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Play, Pause, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  status: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
  emailStats?: { sent: number; openRate: number; replyRate: number; bounceRate: number };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active": return <Badge className="bg-success text-success-foreground">Active</Badge>;
    case "paused": return <Badge className="bg-warning text-warning-foreground">Paused</Badge>;
    case "draft": return <Badge variant="secondary">Draft</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export default function Campaigns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", status: "draft" });

  const fetchCampaigns = async () => {
    if (!user) return;
    setLoading(true);

    const { data: campaignsData, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch email stats per campaign
    const { data: logs } = await supabase
      .from("email_logs")
      .select("campaign_id, opened_at, replied_at, bounced")
      .eq("user_id", user.id);

    const statsMap = new Map<string, { sent: number; opened: number; replied: number; bounced: number }>();
    (logs || []).forEach((log) => {
      if (!log.campaign_id) return;
      if (!statsMap.has(log.campaign_id)) statsMap.set(log.campaign_id, { sent: 0, opened: 0, replied: 0, bounced: 0 });
      const s = statsMap.get(log.campaign_id)!;
      s.sent++;
      if (log.opened_at) s.opened++;
      if (log.replied_at) s.replied++;
      if (log.bounced) s.bounced++;
    });

    const mapped: Campaign[] = (campaignsData || []).map((c) => {
      const s = statsMap.get(c.id);
      return {
        ...c,
        emailStats: s
          ? {
              sent: s.sent,
              openRate: s.sent > 0 ? Math.round((s.opened / s.sent) * 1000) / 10 : 0,
              replyRate: s.sent > 0 ? Math.round((s.replied / s.sent) * 1000) / 10 : 0,
              bounceRate: s.sent > 0 ? Math.round((s.bounced / s.sent) * 1000) / 10 : 0,
            }
          : undefined,
      };
    });

    setCampaigns(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", subject: "", status: "draft" });
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({ name: c.name, subject: c.subject || "", status: c.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) return;

    if (editing) {
      const { error } = await supabase
        .from("campaigns")
        .update({ name: form.name, subject: form.subject || null, status: form.status, updated_at: new Date().toISOString() })
        .eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Campaign updated" });
    } else {
      const { error } = await supabase
        .from("campaigns")
        .insert({ user_id: user.id, name: form.name, subject: form.subject || null, status: form.status });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Campaign created" });
    }

    setDialogOpen(false);
    fetchCampaigns();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Campaign deleted" });
    setDeleteId(null);
    fetchCampaigns();
  };

  const toggleStatus = async (c: Campaign) => {
    const newStatus = c.status === "active" ? "paused" : "active";
    const { error } = await supabase
      .from("campaigns")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", c.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    fetchCampaigns();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Manage your outreach campaigns</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading campaigns…</p>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No campaigns yet. Create your first campaign to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    {campaign.subject && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Subject: {campaign.subject}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {campaign.status !== "draft" && (
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(campaign)}>
                        {campaign.status === "active" ? (
                          <><Pause className="h-4 w-4 mr-1" /> Pause</>
                        ) : (
                          <><Play className="h-4 w-4 mr-1" /> Resume</>
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(campaign)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(campaign.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {campaign.emailStats && campaign.emailStats.sent > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <div className="text-2xl font-bold">{campaign.emailStats.sent.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{campaign.emailStats.openRate}%</div>
                      <div className="text-xs text-muted-foreground">Open Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{campaign.emailStats.replyRate}%</div>
                      <div className="text-xs text-muted-foreground">Reply Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{campaign.emailStats.bounceRate}%</div>
                      <div className="text-xs text-muted-foreground">Bounce Rate</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Campaign" : "New Campaign"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Email subject" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editing ? "Save Changes" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this campaign and all associated email logs.</AlertDialogDescription>
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
