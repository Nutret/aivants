import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Save, Mail, CheckCircle2, Shield, Copy, RefreshCw, MessageCircle, Link2, Unlink, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AISettingsSection } from "@/components/AISettingsSection";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Email config state
  const [fromEmail, setFromEmail] = useState("");
  const [emailProvider, setEmailProvider] = useState("sendgrid");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Telegram state
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [unlinkingTelegram, setUnlinkingTelegram] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ replies: true, meetings: true, campaigns: true });
  const [savingNotifPrefs, setSavingNotifPrefs] = useState(false);

  // Test email state
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState({
    to: "",
    subject: "Test Email from Aivants CRM",
    body: "<h2>Hello!</h2><p>This is a test email sent from your Aivants CRM. If you're reading this, your email integration is working correctly! 🎉</p>",
  });

  // Load saved settings
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingSettings(true);
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!error && data) {
        setFromEmail(data.from_email || "");
        setEmailProvider(data.email_provider || "sendgrid");
        setWebhookSecret((data as any).webhook_secret || "");
        setSettingsId(data.id);
      }

      // Load Telegram link
      const { data: tgData } = await supabase
        .from("telegram_users" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (tgData) {
        setTelegramLinked(true);
        setTelegramChatId(String((tgData as any).telegram_chat_id || ""));
        setTelegramUsername((tgData as any).telegram_username || null);
        const prefs = (tgData as any).notification_prefs;
        if (prefs) setNotifPrefs({ replies: prefs.replies ?? true, meetings: prefs.meetings ?? true, campaigns: prefs.campaigns ?? true });
      }

      setLoadingSettings(false);
    })();
  }, [user]);

  const handleSaveEmailConfig = async () => {
    if (!user) return;
    if (!fromEmail.trim()) {
      toast({ title: "Missing email", description: "Please enter your verified sender email address.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (settingsId) {
        const { error } = await supabase
          .from("user_settings")
          .update({ from_email: fromEmail.trim(), email_provider: emailProvider, updated_at: new Date().toISOString() })
          .eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, from_email: fromEmail.trim(), email_provider: emailProvider })
          .select()
          .single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      toast({ title: "Saved!", description: "Email configuration updated successfully." });
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.to || !testEmail.subject || !testEmail.body) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (!fromEmail.trim()) {
      toast({ title: "No sender email", description: "Please save your sender email above before sending a test.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { ...testEmail, from_email: fromEmail.trim() },
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

  const generateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleSaveWebhookSecret = async () => {
    if (!user) return;
    setSavingWebhook(true);
    try {
      if (settingsId) {
        const { error } = await supabase
          .from("user_settings")
          .update({ webhook_secret: webhookSecret || null, updated_at: new Date().toISOString() } as any)
          .eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, webhook_secret: webhookSecret || null } as any)
          .select()
          .single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      toast({ title: "Saved!", description: "Webhook secret updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingWebhook(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleLinkTelegram = async () => {
    if (!user || !telegramChatId.trim()) {
      toast({ title: "Missing Chat ID", description: "Enter your Telegram Chat ID.", variant: "destructive" });
      return;
    }
    const chatIdNum = Number(telegramChatId.trim());
    if (!chatIdNum || isNaN(chatIdNum)) {
      toast({ title: "Invalid Chat ID", description: "Chat ID must be a number. Send /start to the bot to get it.", variant: "destructive" });
      return;
    }
    setSavingTelegram(true);
    try {
      const { error } = await supabase.from("telegram_users" as any).insert({
        user_id: user.id,
        telegram_chat_id: chatIdNum,
      } as any);
      if (error) throw error;
      setTelegramLinked(true);
      toast({ title: "Telegram Linked!", description: "Your bot will now send notifications." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingTelegram(false);
    }
  };

  const handleSaveNotifPrefs = async (prefs: typeof notifPrefs) => {
    if (!user) return;
    setSavingNotifPrefs(true);
    try {
      const { error } = await supabase
        .from("telegram_users" as any)
        .update({ notification_prefs: prefs } as any)
        .eq("user_id", user.id);
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingNotifPrefs(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!user) return;
    setUnlinkingTelegram(true);
    try {
      const { error } = await supabase.from("telegram_users" as any).delete().eq("user_id", user.id);
      if (error) throw error;
      setTelegramLinked(false);
      setTelegramChatId("");
      setTelegramUsername(null);
      toast({ title: "Telegram Unlinked" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUnlinkingTelegram(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and email configuration</p>
      </div>

      {/* Account Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Account</span>
          </CardTitle>
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

      {/* Email Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            Configure your outgoing email sender identity. This email will be used as the "From" address for all outreach emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loadingSettings ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading settings…
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Email Provider</Label>
                <Select value={emailProvider} onValueChange={setEmailProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sendgrid">
                      <span className="flex items-center gap-2">SendGrid <Badge variant="secondary" className="text-xs">Active</Badge></span>
                    </SelectItem>
                    <SelectItem value="resend" disabled>
                      <span className="flex items-center gap-2">Resend <Badge variant="outline" className="text-xs">Coming Soon</Badge></span>
                    </SelectItem>
                    <SelectItem value="smtp" disabled>
                      <span className="flex items-center gap-2">Custom SMTP <Badge variant="outline" className="text-xs">Coming Soon</Badge></span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Verified Sender Email *</Label>
                <Input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="you@yourdomain.com"
                />
                <p className="text-xs text-muted-foreground">
                  This must be a verified sender in your SendGrid account. Emails will fail if the address isn't verified.
                </p>
              </div>

              {fromEmail && settingsId && (
                <div className="flex items-center gap-2 text-sm text-accent-foreground bg-accent/10 p-2 rounded-md">
                  <CheckCircle2 className="h-4 w-4" />
                  Currently saved: <span className="font-mono font-medium">{fromEmail}</span>
                </div>
              )}

              <Button onClick={handleSaveEmailConfig} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? "Saving…" : "Save Email Config"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Email Card */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            Verify your email configuration by sending a test email. Uses the saved sender email above.
          </CardDescription>
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
          <Button onClick={handleSendTest} disabled={sending || !fromEmail}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {sending ? "Sending…" : "Send Test Email"}
          </Button>
        </CardContent>
      </Card>

      {/* Webhook Security Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Webhook Security
          </CardTitle>
          <CardDescription>
            Secure your inbound reply webhook with a secret key. External services must include this as an <code className="text-xs bg-muted px-1 rounded">x-webhook-secret</code> header.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Enter or generate a webhook secret"
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWebhookSecret(generateSecret())}
                title="Generate random secret"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {webhookSecret && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(webhookSecret)}
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to accept all incoming webhooks (less secure). Generate a strong secret and add it to your email provider's webhook configuration.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/inbound-reply-webhook`}
                disabled
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/inbound-reply-webhook`)}
                title="Copy URL"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this URL in SendGrid Inbound Parse or other webhook providers.
            </p>
          </div>

          <Button onClick={handleSaveWebhookSecret} disabled={savingWebhook}>
            {savingWebhook ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {savingWebhook ? "Saving…" : "Save Webhook Secret"}
          </Button>
        </CardContent>
      </Card>

      {/* Telegram Bot Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Telegram Bot
          </CardTitle>
          <CardDescription>
            Link your Telegram account to receive notifications and control Aivants from Telegram.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {telegramLinked ? (
            <>
              <div className="flex items-center gap-2 text-sm bg-success/10 text-success p-3 rounded-md">
                <CheckCircle2 className="h-4 w-4" />
                <span>Telegram is <b>linked</b>!</span>
                {telegramUsername && <span className="text-muted-foreground">(@{telegramUsername})</span>}
              </div>
              <div>
                <Label>Chat ID</Label>
                <Input value={telegramChatId} disabled className="font-mono text-sm" />
              </div>
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notification Preferences</Label>
                {([
                  { key: "replies" as const, label: "Reply Alerts", desc: "Get notified when a lead replies to your emails" },
                  { key: "meetings" as const, label: "Meeting Alerts", desc: "Get notified about meeting bookings and pipeline updates" },
                  { key: "campaigns" as const, label: "Campaign Alerts", desc: "Get notified about campaign status changes" },
                ]).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[key]}
                      onCheckedChange={(checked) => {
                        const updated = { ...notifPrefs, [key]: checked };
                        setNotifPrefs(updated);
                        handleSaveNotifPrefs(updated);
                      }}
                    />
                  </div>
                ))}
                {savingNotifPrefs && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</p>}
              </div>
              <Separator />
              <Button variant="destructive" size="sm" onClick={handleUnlinkTelegram} disabled={unlinkingTelegram}>
                {unlinkingTelegram ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unlink className="h-4 w-4 mr-2" />}
                Unlink Telegram
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  <b>How to link:</b><br/>
                  1. Open Telegram and search for your Aivants bot<br/>
                  2. Send <code>/start</code> to the bot<br/>
                  3. Copy the Chat ID the bot gives you<br/>
                  4. Paste it below and click "Link Account"
                </p>
                <div>
                  <Label>Telegram Chat ID</Label>
                  <Input
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="e.g. 123456789"
                    className="font-mono"
                  />
                </div>
              </div>
              <Button onClick={handleLinkTelegram} disabled={savingTelegram || !telegramChatId.trim()}>
                {savingTelegram ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                {savingTelegram ? "Linking…" : "Link Account"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Settings */}
      <AISettingsSection />
    </div>
  );
}
