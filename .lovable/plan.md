

# Aivants — AI-Powered Lead Intelligence Platform

## Phase 1: Foundation & Core Features

### 1. Authentication
- Simple email/password login and signup using Supabase Auth
- Protected routes — redirect unauthenticated users to login
- User profile with basic settings

### 2. Database Setup (Supabase)
- **leads** table: id, first_name, last_name, company_name, email, phone, industry, location, website, lead_score, status, user_id, created_at, updated_at
- **companies** table: id, company_name, industry, location, website, employee_size, revenue_estimate, created_at
- **campaigns** table: id, name, template_id, status (draft/active/paused/completed), daily_limit, lead_segment_filters, user_id, created_at
- **email_templates** table: id, name, subject, body (with variable placeholders), user_id, created_at
- **email_logs** table: id, lead_id, campaign_id, sent_at, status, opened, clicked, replied, bounced
- **pipeline_stages** table: id, lead_id, stage (New Lead → Client Won/Lost), notes, updated_at
- Row-Level Security so each user only sees their own data

### 3. Dashboard Page
- Top stat cards: Total Leads, Active Campaigns, Emails Sent Today, Open Rate, Reply Rate, Meetings Booked, Clients Won
- Campaign performance chart (using Recharts)
- Recent lead activity feed

### 4. Leads Page
- Data table with columns: Name, Company, Email, Phone, Industry, Location, Lead Score, Status
- Search bar, filters (industry, location, score range, status, company size), sorting, pagination
- Bulk selection with bulk actions (delete, assign to campaign, update status)
- Lead detail slide-out panel: contact info, company info, engagement history, notes, activity timeline

### 5. Import Leads Page
- CSV/Excel file upload with drag-and-drop
- Client-side parsing and preview of first rows
- Validation pipeline: email format check, duplicate detection, missing field detection
- Import progress bar with summary (imported, skipped, errors)
- Edge function to process and store validated leads in batches

### 6. Campaigns Page
- Campaign creation form: name, lead segment (filter criteria), email template selection, sending schedule, daily limit
- Campaign list with status badges
- Campaign detail view showing: emails sent, open rate, reply rate, bounce rate, meetings booked

### 7. Email Templates Page
- Template editor with variable insertion buttons ({first_name}, {last_name}, {company_name}, {industry}, {location})
- Live preview showing variable replacement with sample data
- Template list with edit/duplicate/delete actions

### 8. Pipeline Page
- Drag-and-drop Kanban board with stages: New Lead → Contacted → Interested → Meeting Scheduled → Proposal Sent → Client Won / Client Lost
- Lead cards showing name, company, score
- Click to view lead timeline (emails sent, opened, replied, meetings, etc.)

### 9. Email Sending (Edge Function + SendGrid)
- Supabase Edge Function that:
  - Fetches queued campaign emails
  - Personalizes templates (variable replacement)
  - Sends via SendGrid API
  - Logs results in email_logs table
- Rate limiting: 50/min, 500/hr, 10k/day
- Automatic retry for failed sends

### 10. Lead Scoring
- Auto-calculated score based on: valid email (+20), has website (+15), matching industry (+20), company size (+15), engagement history (+30)
- Score tiers displayed as badges: High (90-100), Medium (70-89), Low (50-69)

### 11. Analytics Page
- Charts: daily sending volume, engagement trends over time, top performing campaigns
- Summary metrics: total sent, open rate, reply rate, bounce rate, conversions

### 12. Navigation & Layout
- Sidebar navigation: Dashboard, Leads, Campaigns, Templates, Pipeline, Analytics, Settings
- Clean, minimal, data-focused design
- Responsive layout

