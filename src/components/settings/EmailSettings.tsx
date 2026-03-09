import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Save, Loader2, Send, CheckCircle2 } from "lucide-react";

export function EmailSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fromEmail, setFromEmail] = useState("");
  const [emailProvider, setEmailProvider] = useState("sendgrid");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState({
    to: "",
    subject: "Test Email from Aivants CRM",
    body: "<h2>Hello!</h2><p>This is a test email sent from your Aivants CRM. If you're reading this, your email integration is working correctly! 🎉</p>",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data, error }) => {
      if (!error && data) {
        setFromEmail(data.from_email || "");
        setEmailProvider(data.email_provider || "sendgrid");
        setSettingsId(data.id);
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user || !fromEmail.trim()) {
      toast({ title: "Missing email", description: "Please enter your verified sender email.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (settingsId) {
        const { error } = await supabase.from("user_settings").update({ from_email: fromEmail.trim(), email_provider: emailProvider, updated_at: new Date().toISOString() }).eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("user_settings").insert({ user_id: user.id, from_email: fromEmail.trim(), email_provider: emailProvider }).select().single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      toast({ title: "Email configuration saved!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSendTest = async () => {
    if (!testEmail.to || !fromEmail.trim()) {
      toast({ title: "Missing fields", description: "Fill in all fields and save sender email first.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { ...testEmail, from_email: fromEmail.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Test email sent!", description: `Delivered to ${testEmail.to}` });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
    setSending(false);
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Mail className="h-6 w-6 text-primary" />Email & Messaging</h1>
        <p className="text-muted-foreground text-sm">Configure outgoing email provider and sender identity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Provider</CardTitle>
          <CardDescription>Select and configure your email delivery service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={emailProvider} onValueChange={setEmailProvider}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sendgrid"><span className="flex items-center gap-2">SendGrid <Badge variant="secondary" className="text-xs">Active</Badge></span></SelectItem>
                <SelectItem value="resend" disabled><span className="flex items-center gap-2">Resend <Badge variant="outline" className="text-xs">Coming Soon</Badge></span></SelectItem>
                <SelectItem value="smtp" disabled><span className="flex items-center gap-2">Custom SMTP <Badge variant="outline" className="text-xs">Coming Soon</Badge></span></SelectItem>
                <SelectItem value="ses" disabled><span className="flex items-center gap-2">Amazon SES <Badge variant="outline" className="text-xs">Coming Soon</Badge></span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Verified Sender Email *</Label>
            <Input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="you@yourdomain.com" />
            <p className="text-xs text-muted-foreground">Must be a verified sender in your SendGrid account.</p>
          </div>

          {fromEmail && settingsId && (
            <div className="flex items-center gap-2 text-sm text-accent-foreground bg-accent/10 p-2 rounded-md">
              <CheckCircle2 className="h-4 w-4" />
              Currently saved: <span className="font-mono font-medium">{fromEmail}</span>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Email Config
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>Verify your configuration by sending a test message</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>To Email *</Label><Input type="email" value={testEmail.to} onChange={e => setTestEmail({ ...testEmail, to: e.target.value })} placeholder="recipient@example.com" /></div>
          <div><Label>Subject *</Label><Input value={testEmail.subject} onChange={e => setTestEmail({ ...testEmail, subject: e.target.value })} /></div>
          <div><Label>Body (HTML) *</Label><Textarea value={testEmail.body} onChange={e => setTestEmail({ ...testEmail, body: e.target.value })} rows={4} /></div>
          <Button onClick={handleSendTest} disabled={sending || !fromEmail}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send Test Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
