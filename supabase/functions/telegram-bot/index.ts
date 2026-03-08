import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendMessage(token: string, chatId: number, text: string, parseMode = "HTML") {
  await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

async function sendDocument(token: string, chatId: number, fileUrl: string, caption: string) {
  await fetch(`${TELEGRAM_API}${token}/sendDocument`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, document: fileUrl, caption, parse_mode: "HTML" }),
  });
}

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getUserForChat(db: any, chatId: number) {
  const { data } = await db
    .from("telegram_users")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .eq("is_active", true)
    .maybeSingle();
  return data?.user_id || null;
}

// ===================== COMMAND HANDLERS =====================

async function handleStart(token: string, chatId: number, username: string | undefined) {
  const db = getServiceClient();
  const { data: existing } = await db
    .from("telegram_users")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (existing) {
    await sendMessage(token, chatId, `✅ You're already linked to Aivants!\n\nUse /help to see all commands.`);
    return;
  }

  // Generate a 6-digit linking code and store it temporarily
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Store code in telegram_users with a null user_id temporarily — we'll use a different approach
  // Instead, just tell them to link via Settings page
  await sendMessage(
    token,
    chatId,
    `👋 <b>Welcome to Aivants Bot!</b>\n\n` +
    `Your Telegram Chat ID is: <code>${chatId}</code>\n\n` +
    `To link your account:\n` +
    `1. Go to Aivants → Settings\n` +
    `2. Paste this Chat ID in the Telegram section\n` +
    `3. Click "Link Account"\n\n` +
    `Once linked, use /help for all commands.`
  );
}

async function handleHelp(token: string, chatId: number) {
  await sendMessage(
    token,
    chatId,
    `📋 <b>Aivants Bot Commands</b>\n\n` +
    `<b>Dashboard</b>\n` +
    `/dashboard — View platform overview\n\n` +
    `<b>Leads</b>\n` +
    `/addlead — Add a new lead\n` +
    `/findlead [query] — Search leads\n` +
    `/prospect — Quick contact new prospect\n\n` +
    `<b>Email</b>\n` +
    `/sendemail — Send email to a lead\n` +
    `/sendasset — Send content asset\n\n` +
    `<b>Campaigns</b>\n` +
    `/startcampaign — Activate a campaign\n` +
    `/pausecampaign — Pause a campaign\n` +
    `/campaignstats — View campaign stats\n\n` +
    `<b>Settings</b>\n` +
    `/status — Check connection status`
  );
}

async function handleDashboard(token: string, chatId: number) {
  const db = getServiceClient();
  const userId = await getUserForChat(db, chatId);
  if (!userId) return sendMessage(token, chatId, "❌ Account not linked. Use /start to begin.");

  const [{ count: leadCount }, { count: campaignCount }, { data: todayLogs }, { data: pipeline }] = await Promise.all([
    db.from("leads").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("campaigns").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("email_logs").select("id, replied_at").eq("user_id", userId).gte("sent_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    db.from("pipeline_stages").select("meeting_booked, client_won").eq("user_id", userId),
  ]);

  const emailsToday = todayLogs?.length || 0;
  const repliesToday = todayLogs?.filter((l: any) => l.replied_at)?.length || 0;
  const meetings = pipeline?.filter((p: any) => p.meeting_booked)?.length || 0;
  const clientsWon = pipeline?.filter((p: any) => p.client_won)?.length || 0;

  await sendMessage(
    token,
    chatId,
    `📊 <b>Aivants Dashboard</b>\n\n` +
    `👥 Leads: <b>${leadCount || 0}</b>\n` +
    `📣 Active Campaigns: <b>${campaignCount || 0}</b>\n` +
    `📧 Emails Sent Today: <b>${emailsToday}</b>\n` +
    `💬 Replies Today: <b>${repliesToday}</b>\n` +
    `📅 Meetings Booked: <b>${meetings}</b>\n` +
    `🏆 Clients Won: <b>${clientsWon}</b>`
  );
}

async function handleAddLead(token: string, chatId: number, text: string) {
  const db = getServiceClient();
  const userId = await getUserForChat(db, chatId);
  if (!userId) return sendMessage(token, chatId, "❌ Account not linked. Use /start to begin.");

  // Parse: /addlead Name | Company | email@example.com
  const parts = text.replace("/addlead", "").trim();
  if (!parts) {
    return sendMessage(
      token,
      chatId,
      `📝 <b>Add Lead</b>\n\nFormat:\n<code>/addlead Name | Company | email@example.com</code>\n\nExample:\n<code>/addlead John Smith | Alpha Realty | john@alpharealty.com</code>`
    );
  }

  const [name, company, email] = parts.split("|").map((s) => s.trim());
  if (!name || !email) {
    return sendMessage(token, chatId, "❌ Please provide at least Name and Email.\n\nFormat: <code>/addlead Name | Company | email</code>");
  }

  const nameParts = name.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || null;

  const { error } = await db.from("leads").insert({
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    company_name: company || null,
    email: email,
    status: "new",
  });

  if (error) {
    return sendMessage(token, chatId, `❌ Error: ${error.message}`);
  }

  await sendMessage(
    token,
    chatId,
    `✅ <b>Lead Added Successfully</b>\n\n` +
    `👤 Name: ${name}\n` +
    `🏢 Company: ${company || "N/A"}\n` +
    `📧 Email: ${email}`
  );
}

async function handleFindLead(token: string, chatId: number, text: string) {
  const db = getServiceClient();
  const userId = await getUserForChat(db, chatId);
  if (!userId) return sendMessage(token, chatId, "❌ Account not linked. Use /start to begin.");

  const query = text.replace("/findlead", "").trim();
  if (!query) {
    return sendMessage(token, chatId, "🔍 Usage: <code>/findlead company name or email</code>");
  }

  const { data: leads } = await db
    .from("leads")
    .select("first_name, last_name, company_name, email, status, updated_at")
    .eq("user_id", userId)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,company_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(5);

  if (!leads || leads.length === 0) {
    return sendMessage(token, chatId, `🔍 No leads found for "<b>${query}</b>"`);
  }

  let msg = `🔍 <b>Search Results for "${query}"</b>\n\n`;
  leads.forEach((l: any, i: number) => {
    msg += `${i + 1}. <b>${l.first_name} ${l.last_name || ""}</b>\n`;
    msg += `   🏢 ${l.company_name || "N/A"}\n`;
    msg += `   📧 ${l.email}\n`;
    msg += `   Status: ${l.status}\n\n`;
  });

  await sendMessage(token, chatId, msg);
}

async function handleSendEmail(token: string, chatId: number, text: string) {
  const db = getServiceClient();
  const userId = await getUserForChat(db, chatId);
  if (!userId) return sendMessage(token, chatId, "❌ Account not linked. Use /start to begin.");

  // Parse: /sendemail email@example.com | Subject | Body
  const parts = text.replace("/sendemail", "").trim();
  if (!parts) {
    return sendMessage(
      token,
      chatId,
      `📧 <b>Send Email</b>\n\nFormat:\n<code>/sendemail email | Subject | Body text</code>\n\nExample:\n<code>/sendemail john@co.com | Follow Up | Hi John, just following up on our conversation.</code>`
    );
  }

  const [toEmail, subject, ...bodyParts] = parts.split("|").map((s) => s.trim());
  if (!toEmail || !subject) {
    return sendMessage(token, chatId, "❌ Please provide email, subject, and body.\n\nFormat: <code>/sendemail email | subject | body</code>");
  }
  const body = bodyParts.join("|").trim() || subject;

  // Get sender email
  const { data: settings } = await db
    .from("user_settings")
    .select("from_email")
    .eq("user_id", userId)
    .maybeSingle();
  const fromEmail = settings?.from_email || "noreply@example.com";

  // Find lead
  const { data: lead } = await db
    .from("leads")
    .select("id")
    .eq("user_id", userId)
    .eq("email", toEmail)
    .maybeSingle();

  // Send via SendGrid
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
  if (!SENDGRID_API_KEY) {
    return sendMessage(token, chatId, "❌ SendGrid not configured.");
  }

  const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: fromEmail },
      subject,
      content: [{ type: "text/html", value: `<p>${body.replace(/\n/g, "<br>")}</p>` }],
    }),
  });

  if (!sgResponse.ok) {
    const errText = await sgResponse.text();
    return sendMessage(token, chatId, `❌ Email failed: ${errText.substring(0, 200)}`);
  }

  // Log
  await db.from("email_logs").insert({
    user_id: userId,
    lead_id: lead?.id || null,
    status: "sent",
    sent_at: new Date().toISOString(),
  });

  await sendMessage(token, chatId, `📩 <b>Email Sent Successfully</b>\n\nTo: ${toEmail}\nSubject: ${subject}`);
}

async function handleProspect(token: string, chatId: number, text: string) {
  const db = getServiceClient();
  const userId = await getUserForChat(db, chatId);
  if (!userId) return sendMessage(token, chatId, "❌ Account not linked. Use /start to begin.");

  const parts = text.replace("/prospect", "").trim();
  if (!parts) {
    return sendMessage(
      token,
      chatId,
      `🚀 <b>Quick Prospect</b>\n\nFormat:\n<code>/prospect Name | Company | email</code>\n\nThis will:\n1. Create the lead\n2. Send welcome email\n3. Start follow-up sequence`
    );
  }

  const [name, company, email] = parts.split("|").map((s) => s.trim());
  if (!name || !email) {
    return sendMessage(token, chatId, "❌ Provide Name and Email.\nFormat: <code>/prospect Name | Company | email</code>");
  }

  const nameParts = name.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || null;

  // 1. Create lead
  const { data: newLead, error: leadErr } = await db
    .from("leads")
    .insert({ user_id: userId, first_name: firstName, last_name: lastName, company_name: company || null, email, status: "new" })
    .select("id")
    .single();

  if (leadErr) {
    return sendMessage(token, chatId, `❌ Error creating lead: ${leadErr.message}`);
  }

  // 2. Send welcome email
  const { data: settings } = await db.from("user_settings").select("from_email").eq("user_id", userId).maybeSingle();
  const fromEmail = settings?.from_email || "noreply@example.com";
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

  if (SENDGRID_API_KEY) {
    const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: fromEmail },
        subject: `Hi ${firstName}, let's connect!`,
        content: [{ type: "text/html", value: `<p>Hi ${firstName},</p><p>I'd love to explore how we can help ${company || "your company"} grow. Would you be open to a quick chat this week?</p><p>Looking forward to hearing from you!</p>` }],
      }),
    });

    if (sgResponse.ok) {
      await db.from("email_logs").insert({ user_id: userId, lead_id: newLead.id, status: "sent", sent_at: new Date().toISOString() });
    }
  }

  // 3. Enroll in first active sequence
  const { data: sequence } = await db
    .from("followup_sequences")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (sequence) {
    await db.from("followup_status").insert({
      user_id: userId,
      lead_id: newLead.id,
      sequence_id: sequence.id,
      status: "active",
      current_step: 0,
      next_followup_date: new Date(Date.now() + 86400000).toISOString(),
    });
  }

  // Create pipeline entry
  await db.from("pipeline_stages").insert({ user_id: userId, lead_id: newLead.id, stage: "Contacted" });

  await sendMessage(
    token,
    chatId,
    `🚀 <b>Prospect Contacted Successfully</b>\n\n` +
    `👤 ${name}\n🏢 ${company || "N/A"}\n📧 ${email}\n\n` +
    `✅ Lead created\n` +
    `✅ Welcome email sent\n` +
    (sequence ? `✅ Follow-up sequence started` : `⚠️ No active sequence found`)
  );
}

async function handleSendAsset(token: string, chatId: number, text: string) {
  const db = getServiceClient();
  const userId = await getUserForChat(db, chatId);
  if (!userId) return sendMessage(token, chatId, "❌ Account not linked. Use /start to begin.");

  const parts = text.replace("/sendasset", "").trim();
  if (!parts) {
    const { data: assets } = await db
      .from("content_assets")
      .select("title, id")
      .eq("user_id", userId)
      .limit(10);

    let assetList = "No assets found.";
    if (assets && assets.length > 0) {
      assetList = assets.map((a: any) => `• ${a.title}`).join("\n");
    }

    return sendMessage(
      token,
      chatId,
      `📎 <b>Send Content Asset</b>\n\nFormat:\n<code>/sendasset email | asset title</code>\n\n<b>Available assets:</b>\n${assetList}`
    );
  }

  const [toEmail, assetTitle] = parts.split("|").map((s) => s.trim());
  if (!toEmail || !assetTitle) {
    return sendMessage(token, chatId, "❌ Format: <code>/sendasset email | asset title</code>");
  }

  // Find asset
  const { data: asset } = await db
    .from("content_assets")
    .select("*")
    .eq("user_id", userId)
    .ilike("title", `%${assetTitle}%`)
    .limit(1)
    .maybeSingle();

  if (!asset) {
    return sendMessage(token, chatId, `❌ Asset "${assetTitle}" not found. Use <code>/sendasset</code> to see available assets.`);
  }

  // Send email with asset link
  const { data: settings } = await db.from("user_settings").select("from_email").eq("user_id", userId).maybeSingle();
  const fromEmail = settings?.from_email || "noreply@example.com";
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

  if (!SENDGRID_API_KEY) {
    return sendMessage(token, chatId, "❌ SendGrid not configured.");
  }

  const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: fromEmail },
      subject: `${asset.title} — Shared with you`,
      content: [{ type: "text/html", value: `<p>Hi,</p><p>Please find the requested resource below:</p><p><strong>${asset.title}</strong></p>${asset.description ? `<p>${asset.description}</p>` : ""}<p><a href="${asset.file_url}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">Download ${asset.type.toUpperCase()}</a></p>` }],
    }),
  });

  if (!sgResponse.ok) {
    const errText = await sgResponse.text();
    return sendMessage(token, chatId, `❌ Failed to send: ${errText.substring(0, 200)}`);
  }

  // Log
  const { data: lead } = await db.from("leads").select("id").eq("user_id", userId).eq("email", toEmail).maybeSingle();
  await db.from("email_logs").insert({ user_id: userId, lead_id: lead?.id || null, status: "sent", sent_at: new Date().toISOString() });

  await sendMessage(token, chatId, `📎 <b>Asset Sent</b>\n\n📄 ${asset.title}\n📧 To: ${toEmail}`);
}

async function handleStartCampaign(token: string, chatId: number, text: string) {
  const db = getServiceClient();
  const userId = await getUserForChat(db, chatId);
  if (!userId) return sendMessage(token, chatId, "❌ Account not linked. Use /start to begin.");

  const campaignName = text.replace("/startcampaign", "").trim();
  if (!campaignName) {
    const { data: campaigns } = await db
      .from("campaigns")
      .select("name, status")
      .eq("user_id", userId)
      .in("status", ["draft", "paused"])
      .limit(10);

    let list = "No inactive campaigns.";
    if (campaigns && campaigns.length > 0) {
      list = campaigns.map((c: any) => `• ${c.name} (${c.status})`).join("\n");
    }
    return sendMessage(token, chatId, `▶️ <b>Start Campaign</b>\n\nFormat: <code>/startcampaign Campaign Name</code>\n\n<b>Available:</b>\n${list}`);
  }

  const { data: campaign, error } = await db
    .from("campaigns")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .ilike("name", `%${campaignName}%`)
    .select("name")
    .maybeSingle();

  if (error || !campaign) {
    return sendMessage(token, chatId, `❌ Campaign "${campaignName}" not found or couldn't be started.`);
  }

  await sendMessage(token, chatId, `▶️ <b>Campaign Started</b>\n\n📣 ${campaign.name} is now <b>active</b>.`);
}

async function handlePauseCampaign(token: string, chatId: number, text: string) {
  const db = getServiceClient();
  const userId = await getUserForChat(db, chatId);
  if (!userId) return sendMessage(token, chatId, "❌ Account not linked. Use /start to begin.");

  const campaignName = text.replace("/pausecampaign", "").trim();
  if (!campaignName) {
    const { data: campaigns } = await db
      .from("campaigns")
      .select("name")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(10);

    let list = "No active campaigns.";
    if (campaigns && campaigns.length > 0) {
      list = campaigns.map((c: any) => `• ${c.name}`).join("\n");
    }
    return sendMessage(token, chatId, `⏸ <b>Pause Campaign</b>\n\nFormat: <code>/pausecampaign Campaign Name</code>\n\n<b>Active:</b>\n${list}`);
  }

  const { data: campaign } = await db
    .from("campaigns")
    .update({ status: "paused", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .ilike("name", `%${campaignName}%`)
    .select("name")
    .maybeSingle();

  if (!campaign) {
    return sendMessage(token, chatId, `❌ Campaign "${campaignName}" not found.`);
  }

  await sendMessage(token, chatId, `⏸ <b>Campaign Paused</b>\n\n📣 ${campaign.name} is now <b>paused</b>.`);
}

async function handleCampaignStats(token: string, chatId: number) {
  const db = getServiceClient();
  const userId = await getUserForChat(db, chatId);
  if (!userId) return sendMessage(token, chatId, "❌ Account not linked. Use /start to begin.");

  const { data: campaigns } = await db
    .from("campaigns")
    .select("id, name, status")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (!campaigns || campaigns.length === 0) {
    return sendMessage(token, chatId, "📊 No campaigns found.");
  }

  let msg = `📊 <b>Campaign Stats</b>\n\n`;

  for (const c of campaigns) {
    const { data: logs } = await db
      .from("email_logs")
      .select("opened_at, replied_at, bounced")
      .eq("user_id", userId)
      .eq("campaign_id", c.id);

    const total = logs?.length || 0;
    const opened = logs?.filter((l: any) => l.opened_at).length || 0;
    const replied = logs?.filter((l: any) => l.replied_at).length || 0;
    const openRate = total > 0 ? Math.round((opened / total) * 100) : 0;

    msg += `<b>${c.name}</b> (${c.status})\n`;
    msg += `📧 Sent: ${total} | Open: ${openRate}% | Replies: ${replied}\n\n`;
  }

  await sendMessage(token, chatId, msg);
}

async function handleStatus(token: string, chatId: number) {
  const db = getServiceClient();
  const userId = await getUserForChat(db, chatId);

  if (userId) {
    await sendMessage(token, chatId, `✅ <b>Connected</b>\n\nYour Telegram is linked to Aivants.\nChat ID: <code>${chatId}</code>`);
  } else {
    await sendMessage(token, chatId, `❌ <b>Not Connected</b>\n\nUse /start to get your Chat ID, then link in Aivants Settings.`);
  }
}

// ===================== MAIN HANDLER =====================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!BOT_TOKEN) {
      return new Response(JSON.stringify({ error: "Bot token not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const update = await req.json();
    const message = update.message;

    if (!message || !message.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from?.username;
    const command = text.split(" ")[0].toLowerCase().split("@")[0]; // handle @botname suffix

    switch (command) {
      case "/start":
        await handleStart(BOT_TOKEN, chatId, username);
        break;
      case "/help":
        await handleHelp(BOT_TOKEN, chatId);
        break;
      case "/dashboard":
        await handleDashboard(BOT_TOKEN, chatId);
        break;
      case "/addlead":
        await handleAddLead(BOT_TOKEN, chatId, text);
        break;
      case "/findlead":
        await handleFindLead(BOT_TOKEN, chatId, text);
        break;
      case "/sendemail":
        await handleSendEmail(BOT_TOKEN, chatId, text);
        break;
      case "/prospect":
        await handleProspect(BOT_TOKEN, chatId, text);
        break;
      case "/sendasset":
        await handleSendAsset(BOT_TOKEN, chatId, text);
        break;
      case "/startcampaign":
        await handleStartCampaign(BOT_TOKEN, chatId, text);
        break;
      case "/pausecampaign":
        await handlePauseCampaign(BOT_TOKEN, chatId, text);
        break;
      case "/campaignstats":
        await handleCampaignStats(BOT_TOKEN, chatId);
        break;
      case "/status":
        await handleStatus(BOT_TOKEN, chatId);
        break;
      default:
        await sendMessage(BOT_TOKEN, chatId, "🤔 Unknown command. Use /help to see available commands.");
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Telegram bot error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
