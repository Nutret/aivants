import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState({
    to: "zaticsweb@gmail.com",
    from_email: "",
    subject: "Test Email from Outreach CRM",
    body: "<h2>Hello!</h2><p>This is a test email sent from your Outreach CRM. If you're reading this, your SendGrid integration is working correctly! 🎉</p>",
  });

  const handleSendTest = async () => {
    if (!testEmail.to || !testEmail.subject || !testEmail.body) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: testEmail,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error + (data.details ? `: ${data.details}` : ""));
      toast({ title: "Email sent!", description: `Test email delivered to ${testEmail.to}` });
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div>
            <Label>User ID</Label>
            <Input value={user?.id || ""} disabled className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Provider</CardTitle>
          <CardDescription>SendGrid is configured via Lovable Cloud secrets. Use the form below to send a test email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>To Email *</Label>
            <Input
              type="email"
              value={testEmail.to}
              onChange={(e) => setTestEmail({ ...testEmail, to: e.target.value })}
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <Label>From Email (optional — defaults to noreply@example.com)</Label>
            <Input
              type="email"
              value={testEmail.from_email}
              onChange={(e) => setTestEmail({ ...testEmail, from_email: e.target.value })}
              placeholder="outreach@yourdomain.com"
            />
          </div>
          <div>
            <Label>Subject *</Label>
            <Input
              value={testEmail.subject}
              onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
              placeholder="Email subject"
            />
          </div>
          <div>
            <Label>Body (HTML) *</Label>
            <Textarea
              value={testEmail.body}
              onChange={(e) => setTestEmail({ ...testEmail, body: e.target.value })}
              placeholder="<p>Your email content...</p>"
              rows={5}
            />
          </div>
          <Button onClick={handleSendTest} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {sending ? "Sending…" : "Send Test Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
