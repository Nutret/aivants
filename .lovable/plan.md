

# Aivants Platform Extension Plan

This is a massive undertaking. To deliver it reliably without breaking what already works, I recommend a phased approach. Each phase builds on the previous one and delivers usable value.

---

## What Exists Today

- Lead import (CSV), lead database with filtering/bulk actions
- Email templates with variable substitution
- Campaigns (CRUD, basic stats)
- Pipeline (Kanban board with drag-drop)
- Analytics (7-day charts, summary stats)
- Settings (SendGrid sender config, test email)
- Email sending via SendGrid edge function

---

## Phase 1: Script Library + Content Library + Navigation Updates

**New database tables:**

```text
outreach_scripts
  id, user_id, name, category (cold_outreach|follow_up|case_study|value_email|
  meeting_request|closing_email|breakup_email), hook, context, value_proposition,
  proof, call_to_action, full_template, variables[], created_at, updated_at

content_assets
  id, user_id, title, description, file_url, type (pdf|ppt|video|case_study|
  demo_link|product_sheet), category, created_at
```

**New pages:**
- `/scripts` -- Script Library: CRUD for structured outreach scripts with section-based editor (hook, context, value prop, proof, CTA). Category filtering. Preview with variable substitution.
- `/content` -- Content Library: Upload/manage sales assets (PDF, PPT, video links, case studies). File storage via Lovable Cloud storage bucket.

**Navigation update:** Add "Scripts" and "Content Library" to sidebar.

**Seed data:** Pre-populate 7 script templates (one per category) so users start with proven frameworks.

---

## Phase 2: AI Email Generator + Follow-Up Sequences

**New database tables:**

```text
followup_sequences
  id, user_id, campaign_id, name, created_at, updated_at

followup_steps
  id, sequence_id, step_number, delay_days, script_id (nullable),
  template_id (nullable), content_asset_id (nullable), subject_override,
  body_override, created_at

followup_status
  id, user_id, lead_id, campaign_id, sequence_id, current_step,
  last_email_sent_at, next_followup_date, status (active|paused|completed|
  replied|unsubscribed), created_at, updated_at
```

**AI Email Generator:**
- Edge function using Lovable AI (gemini-3-flash-preview) that takes a script + lead data + campaign goal and generates a personalized email.
- UI in campaign creation: select script, preview generated email, edit before sending.

**Follow-Up Sequence Builder:**
- `/sequences` page: Visual sequence builder (step list with delay, template/script, optional asset attachment).
- Sequence execution: Cron-triggered edge function that checks `followup_status.next_followup_date`, sends the next step, and advances the status.
- Auto-stop on reply detection (check `email_logs.replied_at`).

---

## Phase 3: AI Company Intelligence + Personalization

**New database table:**

```text
company_intelligence
  id, company_id (nullable), lead_id, user_id, website_summary,
  services, growth_signals, hiring_signals, marketing_activity,
  industry_focus, outreach_angle, ai_opening_line, raw_data (jsonb),
  researched_at, created_at
```

**AI Research Edge Function:**
- Uses Firecrawl connector to scrape company website (about page, services, blog, careers).
- Passes scraped content to Lovable AI to extract structured intelligence (growth signals, hiring, industry focus, suggested outreach angle, personalized opening line).
- Stores results in `company_intelligence` table.

**UI Integration:**
- "Research" button on lead detail sheet triggers analysis.
- Intelligence panel shows extracted insights.
- AI-generated opening lines are injected into email generation.

---

## Phase 4: Multi-Channel + AI Deal Assistant + Enhanced Analytics

**Database additions:**

```text
-- Add channel column to followup_steps
ALTER TABLE followup_steps ADD COLUMN channel text DEFAULT 'email';
-- channels: email, linkedin, whatsapp, sms, phone_reminder

-- AI reply analysis
reply_analysis
  id, email_log_id, lead_id, user_id, classification (interested|
  need_more_info|not_now|not_interested|out_of_office),
  suggested_action, confidence, created_at
```

**Multi-Channel Orchestrator:**
- Sequence steps can specify channel (email sends automatically; LinkedIn/WhatsApp/SMS/phone generate task reminders for the user).
- Channel icons in sequence builder.

**AI Deal Assistant:**
- When a reply is detected, edge function classifies intent using Lovable AI.
- Suggests next action (send case study, book meeting, send pricing).
- UI notification with suggested action buttons.

**Enhanced Analytics Dashboard:**
- Asset engagement tracking (link clicks, views).
- Best performing scripts chart.
- Content engagement rates.
- Revenue tracking (manual input on won deals).

---

## Implementation Priority

I recommend starting with **Phase 1** (Script Library + Content Library) as it delivers immediate value and establishes the foundation for AI features. Each phase takes approximately 2-3 implementation cycles.

**Scalability note:** The current PostgreSQL setup handles millions of records natively. For 10k+ emails/day, the cron-based follow-up engine with batch processing (50 emails per invocation, running every minute) will handle the volume within SendGrid rate limits. Redis/BullMQ would only be needed if moving beyond 100k emails/day, which is outside what can be built in Lovable today.

---

## Technical Details

- All new tables get RLS policies scoped to `auth.uid() = user_id`
- Storage bucket for content assets with authenticated upload policies
- Edge functions: `ai-generate-email`, `ai-research-company`, `ai-classify-reply`, `process-followups` (cron)
- Firecrawl connector needed for company research (Phase 3)
- Lovable AI (LOVABLE_API_KEY already configured) for all AI features

Shall I proceed with Phase 1?

