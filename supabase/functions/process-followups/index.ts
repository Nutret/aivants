import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    if (!SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY not configured");
      return new Response(JSON.stringify({ error: "SendGrid not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();

    // Get all active followup statuses where next_followup_date <= now
    const { data: pendingFollowups, error: fetchError } = await supabase
      .from("followup_status")
      .select("*")
      .eq("status", "active")
      .lte("next_followup_date", now)
      .limit(50);

    if (fetchError) {
      console.error("Error fetching followups:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingFollowups || pendingFollowups.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No pending followups" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const followup of pendingFollowups) {
      try {
        // Check if lead has replied (auto-stop)
        const { data: replyLogs } = await supabase
          .from("email_logs")
          .select("id")
          .eq("lead_id", followup.lead_id)
          .not("replied_at", "is", null)
          .limit(1);

        if (replyLogs && replyLogs.length > 0) {
          await supabase
            .from("followup_status")
            .update({ status: "replied", updated_at: now })
            .eq("id", followup.id);
          continue;
        }

        // Get the next step
        const nextStepNumber = followup.current_step + 1;
        const { data: step } = await supabase
          .from("followup_steps")
          .select("*, outreach_scripts(*), email_templates(*), content_assets(*)")
          .eq("sequence_id", followup.sequence_id)
          .eq("step_number", nextStepNumber)
          .single();

        if (!step) {
          // No more steps - mark as completed
          await supabase
            .from("followup_status")
            .update({ status: "completed", updated_at: now })
            .eq("id", followup.id);
          continue;
        }

        // Only process email channel for now
        if (step.channel !== "email") {
          // Skip non-email channels, advance to next step
          const nextStep = await supabase
            .from("followup_steps")
            .select("step_number, delay_days")
            .eq("sequence_id", followup.sequence_id)
            .gt("step_number", nextStepNumber)
            .order("step_number", { ascending: true })
            .limit(1)
            .single();

          const nextDate = nextStep.data
            ? new Date(Date.now() + nextStep.data.delay_days * 86400000).toISOString()
            : null;

          await supabase
            .from("followup_status")
            .update({
              current_step: nextStepNumber,
              next_followup_date: nextDate,
              updated_at: now,
              ...(nextDate ? {} : { status: "completed" }),
            })
            .eq("id", followup.id);
          continue;
        }

        // Get lead data
        const { data: lead } = await supabase
          .from("leads")
          .select("*")
          .eq("id", followup.lead_id)
          .single();

        if (!lead) {
          await supabase
            .from("followup_status")
            .update({ status: "completed", updated_at: now })
            .eq("id", followup.id);
          continue;
        }

        // Get user's from_email
        const { data: settings } = await supabase
          .from("user_settings")
          .select("from_email")
          .eq("user_id", followup.user_id)
          .single();

        const fromEmail = settings?.from_email || "noreply@example.com";

        // Build email content
        let subject = step.subject_override || "";
        let body = step.body_override || "";

        // Use template if available
        if (!body && step.email_templates) {
          subject = subject || step.email_templates.subject;
          body = step.email_templates.body;
        }

        // Use script if available
        if (!body && step.outreach_scripts) {
          body = step.outreach_scripts.full_template;
          subject = subject || `Quick question for ${lead.first_name || "you"}`;
        }

        if (!body) {
          console.warn(`Step ${nextStepNumber} has no content, skipping`);
          continue;
        }

        // Variable replacement
        const replaceVars = (text: string) =>
          text
            .replace(/\{first_name\}/g, lead.first_name || "")
            .replace(/\{last_name\}/g, lead.last_name || "")
            .replace(/\{company_name\}/g, lead.company_name || "")
            .replace(/\{industry\}/g, lead.industry || "")
            .replace(/\{location\}/g, lead.location || "");

        subject = replaceVars(subject);
        body = replaceVars(body);

        // Append content asset link if present
        if (step.content_assets && step.content_assets.file_url) {
          body += `\n\n📎 ${step.content_assets.title}: ${step.content_assets.file_url}`;
        }

        // Send email via SendGrid
        const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: lead.email }] }],
            from: { email: fromEmail },
            subject,
            content: [{ type: "text/html", value: `<div style="white-space:pre-wrap">${body}</div>` }],
          }),
        });

        if (!sgResponse.ok) {
          const errText = await sgResponse.text();
          console.error(`SendGrid error for lead ${lead.id}:`, errText);
          errors++;
          continue;
        }

        // Log the email
        await supabase.from("email_logs").insert({
          user_id: followup.user_id,
          lead_id: followup.lead_id,
          campaign_id: followup.campaign_id,
          status: "sent",
          sent_at: now,
        });

        // Calculate next followup date
        const { data: nextStepData } = await supabase
          .from("followup_steps")
          .select("step_number, delay_days")
          .eq("sequence_id", followup.sequence_id)
          .gt("step_number", nextStepNumber)
          .order("step_number", { ascending: true })
          .limit(1)
          .single();

        const nextFollowupDate = nextStepData
          ? new Date(Date.now() + nextStepData.delay_days * 86400000).toISOString()
          : null;

        await supabase
          .from("followup_status")
          .update({
            current_step: nextStepNumber,
            last_email_sent_at: now,
            next_followup_date: nextFollowupDate,
            updated_at: now,
            ...(nextFollowupDate ? {} : { status: "completed" }),
          })
          .eq("id", followup.id);

        processed++;
      } catch (stepErr) {
        console.error(`Error processing followup ${followup.id}:`, stepErr);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ processed, errors, total: pendingFollowups.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
