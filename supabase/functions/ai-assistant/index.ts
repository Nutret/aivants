import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tool definitions for the AI agent
const tools = [
  {
    type: "function",
    function: {
      name: "get_leads",
      description: "Get leads with optional filters. Use for queries about leads, prospects, contacts.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status: new, contacted, qualified, converted, lost" },
          limit: { type: "number", description: "Max results (default 20)" },
          order_by: { type: "string", enum: ["created_at", "score", "rating"], description: "Sort field" },
          order_dir: { type: "string", enum: ["asc", "desc"], description: "Sort direction" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_high_value_leads",
      description: "Get leads sorted by score/rating. Use for 'best leads', 'top leads', 'priority leads'.",
      parameters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_leads_by_industry",
      description: "Get leads filtered by industry",
      parameters: { type: "object", properties: { industry: { type: "string" } }, required: ["industry"] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clients",
      description: "Get clients with optional status filter",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_payments",
      description: "Get clients/revenue entries with pending payments",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_client_projects",
      description: "Get projects for a specific client",
      parameters: { type: "object", properties: { client_name: { type: "string" } }, required: ["client_name"] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_projects",
      description: "Get projects with optional status filter",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_projects_near_deadline",
      description: "Get projects with deadlines in the next 7 days",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_monthly_revenue",
      description: "Get revenue data for current month or specified month",
      parameters: { type: "object", properties: { month: { type: "string", description: "YYYY-MM format" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_revenue_summary",
      description: "Get full revenue breakdown: income, expenses, profit, cost breakdown",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_client_lifetime_value",
      description: "Get lifetime value for all or a specific client",
      parameters: { type: "object", properties: { client_name: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_campaigns",
      description: "Get email campaigns with stats",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_email_stats",
      description: "Get email sending statistics: sent, opened, replied, bounced",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pipeline",
      description: "Get deal pipeline with stages and values",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_team_members",
      description: "Get team members and their roles",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_proposals",
      description: "Get proposals with optional status filter",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Search the AI knowledge base for internal company docs, processes, notes",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_followups",
      description: "Get follow-up status and schedules",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
];

// Execute a tool call against the database
async function executeTool(supabase: any, userId: string, name: string, args: any): Promise<any> {
  switch (name) {
    case "get_leads": {
      let q = supabase.from("leads").select("id,first_name,last_name,email,company_name,status,score,rating,industry,source,created_at").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      q = q.order(args.order_by || "created_at", { ascending: args.order_dir === "asc" });
      q = q.limit(args.limit || 20);
      const { data, error } = await q;
      if (error) return { error: error.message };
      return { leads: data, count: data?.length };
    }
    case "get_high_value_leads": {
      const { data } = await supabase.from("leads").select("id,first_name,last_name,email,company_name,status,score,rating,industry,source").eq("user_id", userId).order("score", { ascending: false }).limit(args.limit || 10);
      return { leads: data, count: data?.length };
    }
    case "get_leads_by_industry": {
      const { data } = await supabase.from("leads").select("id,first_name,last_name,email,company_name,status,score,industry").eq("user_id", userId).ilike("industry", `%${args.industry}%`).limit(50);
      return { leads: data, count: data?.length };
    }
    case "get_clients": {
      let q = supabase.from("clients").select("*").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(50);
      return { clients: data, count: data?.length };
    }
    case "get_pending_payments": {
      const { data: clients } = await supabase.from("clients").select("id,name,company,monthly_payment,status").eq("user_id", userId);
      const { data: revenue } = await supabase.from("revenue_entries").select("*").eq("user_id", userId).eq("type", "payment").gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
      const paidClientIds = new Set((revenue || []).map((r: any) => r.client_id));
      const pending = (clients || []).filter((c: any) => c.monthly_payment > 0 && !paidClientIds.has(c.id));
      return { pending_payments: pending, count: pending.length };
    }
    case "get_client_projects": {
      const { data: clients } = await supabase.from("clients").select("id").eq("user_id", userId).ilike("name", `%${args.client_name}%`);
      if (!clients?.length) return { projects: [], message: "Client not found" };
      const { data } = await supabase.from("projects").select("*").in("client_id", clients.map((c: any) => c.id));
      return { projects: data, count: data?.length };
    }
    case "get_projects": {
      let q = supabase.from("projects").select("id,name,status,deadline,start_date,client_id,description").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(50);
      return { projects: data, count: data?.length };
    }
    case "get_projects_near_deadline": {
      const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
      const { data } = await supabase.from("projects").select("id,name,status,deadline,client_id").eq("user_id", userId).not("deadline", "is", null).lte("deadline", nextWeek.toISOString().split("T")[0]).neq("status", "completed");
      return { projects: data, count: data?.length };
    }
    case "get_monthly_revenue": {
      const now = new Date();
      const month = args.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      const { data } = await supabase.from("revenue_entries").select("*").eq("user_id", userId).gte("date", startDate).lte("date", endDate);
      const income = (data || []).filter((e: any) => e.type !== "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      const expenses = (data || []).filter((e: any) => e.type === "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      return { month, income, expenses, profit: income - expenses, entries_count: data?.length };
    }
    case "get_revenue_summary": {
      const { data } = await supabase.from("revenue_entries").select("*").eq("user_id", userId);
      const income = (data || []).filter((e: any) => e.type !== "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      const expenses = (data || []).filter((e: any) => e.type === "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      const byCategory: Record<string, number> = {};
      (data || []).forEach((e: any) => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount); });
      return { total_income: income, total_expenses: expenses, profit: income - expenses, by_category: byCategory };
    }
    case "get_client_lifetime_value": {
      const { data: clients } = await supabase.from("clients").select("id,name,company,monthly_payment,contract_start").eq("user_id", userId);
      if (args.client_name) {
        const match = (clients || []).filter((c: any) => c.name.toLowerCase().includes(args.client_name.toLowerCase()));
        if (!match.length) return { message: "Client not found" };
        const { data: rev } = await supabase.from("revenue_entries").select("amount").eq("user_id", userId).in("client_id", match.map((c: any) => c.id));
        const ltv = (rev || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
        return { client: match[0], lifetime_value: ltv };
      }
      const results = [];
      for (const c of (clients || []).slice(0, 20)) {
        const { data: rev } = await supabase.from("revenue_entries").select("amount").eq("client_id", c.id);
        results.push({ name: c.name, company: c.company, monthly: c.monthly_payment, ltv: (rev || []).reduce((s: number, e: any) => s + Number(e.amount), 0) });
      }
      return { clients: results.sort((a, b) => b.ltv - a.ltv) };
    }
    case "get_campaigns": {
      let q = supabase.from("campaigns").select("id,name,status,subject,created_at").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(20);
      return { campaigns: data, count: data?.length };
    }
    case "get_email_stats": {
      const { data } = await supabase.from("email_logs").select("status,opened_at,replied_at,bounced").eq("user_id", userId);
      const total = data?.length || 0;
      const opened = (data || []).filter((e: any) => e.opened_at).length;
      const replied = (data || []).filter((e: any) => e.replied_at).length;
      const bounced = (data || []).filter((e: any) => e.bounced).length;
      return { total_sent: total, opened, replied, bounced, open_rate: total ? ((opened / total) * 100).toFixed(1) + "%" : "0%", reply_rate: total ? ((replied / total) * 100).toFixed(1) + "%" : "0%" };
    }
    case "get_pipeline": {
      const { data } = await supabase.from("pipeline_stages").select("stage,deal_value,meeting_booked,client_won,lead_id").eq("user_id", userId);
      const stages: Record<string, { count: number; value: number }> = {};
      (data || []).forEach((p: any) => {
        if (!stages[p.stage]) stages[p.stage] = { count: 0, value: 0 };
        stages[p.stage].count++;
        stages[p.stage].value += Number(p.deal_value || 0);
      });
      return { pipeline: stages, total_deals: data?.length };
    }
    case "get_team_members": {
      const { data } = await supabase.from("team_members").select("*").eq("user_id", userId);
      return { team: data, active: (data || []).filter((m: any) => m.is_active).length, total: data?.length };
    }
    case "get_proposals": {
      let q = supabase.from("proposals").select("id,name,status,amount,client_name,industry,created_at").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(20);
      return { proposals: data, count: data?.length };
    }
    case "search_knowledge_base": {
      const { data } = await supabase.from("ai_knowledge_base").select("title,content,category").eq("user_id", userId).or(`title.ilike.%${args.query}%,content.ilike.%${args.query}%,category.ilike.%${args.query}%`);
      return { results: data, count: data?.length };
    }
    case "get_followups": {
      let q = supabase.from("followup_status").select("id,client_name,client_company,status,next_followup_date,purpose,category,followup_type").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(30);
      return { followups: data, count: data?.length };
    }
    default:
      return { error: "Unknown tool" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    // Get user from auth token
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, conversation_id, page_context } = await req.json();

    // Load user's AI settings
    const { data: aiSettings } = await supabaseAdmin.from("ai_settings").select("*").eq("user_id", user.id).maybeSingle();
    const provider = aiSettings?.provider || "lovable";
    const model = aiSettings?.model_name || "google/gemini-3-flash-preview";
    const temperature = Number(aiSettings?.temperature) || 0.7;
    const maxTokens = aiSettings?.max_tokens || 4096;

    // Build system prompt
    const systemPrompt = `You are the Aivants AI Command Assistant — an intelligent business operator for a digital agency. You have access to tools that query real business data.

RULES:
- Always use tools to get data before answering data questions. Never make up numbers.
- Use ₹ (INR) for all currency.
- Be concise but actionable. Use bullet points and formatting.
- For destructive actions (delete, remove), ALWAYS ask for confirmation first.
- When showing data, format it as clean markdown tables or lists.
- Support /commands: /show_revenue, /show_leads, /show_clients, /show_pipeline, /show_projects, /show_team
- You can analyze patterns and give recommendations.
${page_context ? `\nCurrent page context: ${page_context}` : ""}

Today's date: ${new Date().toISOString().split("T")[0]}`;

    // Determine API endpoint and headers based on provider
    // Note: For Lovable gateway, always use LOVABLE_API_KEY regardless of user settings
    // Only switch to external APIs if explicitly configured with matching API URL
    let apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    let apiKey = LOVABLE_API_KEY;
    
    // Only use custom API key for truly external providers with their own endpoints
    if (aiSettings?.api_key && aiSettings?.provider) {
      switch (aiSettings.provider) {
        case "openai": 
          apiUrl = "https://api.openai.com/v1/chat/completions";
          apiKey = aiSettings.api_key;
          break;
        case "anthropic": 
          apiUrl = "https://api.anthropic.com/v1/messages";
          apiKey = aiSettings.api_key;
          break;
        case "groq": 
          apiUrl = "https://api.groq.com/openai/v1/chat/completions";
          apiKey = aiSettings.api_key;
          break;
        // For "lovable", "gemini", or any other value, use Lovable gateway with LOVABLE_API_KEY
        default:
          // Keep default Lovable gateway
          break;
      }
    }

    // First AI call with tools
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];


    const firstResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: aiMessages, tools, temperature, max_tokens: maxTokens }),
    });

    if (!firstResponse.ok) {
      const status = firstResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await firstResponse.text();
      console.error("AI error:", status, errText);
      throw new Error("AI gateway error");
    }

    let aiData = await firstResponse.json();
    let assistantMessage = aiData.choices?.[0]?.message;

    // Process tool calls in a loop (up to 5 iterations)
    let iterations = 0;
    while (assistantMessage?.tool_calls && iterations < 5) {
      iterations++;
      const toolResults: any[] = [];

      for (const tc of assistantMessage.tool_calls) {
        const args = JSON.parse(tc.function.arguments || "{}");
        console.log(`Executing tool: ${tc.function.name}`, args);
        const result = await executeTool(supabaseAdmin, user.id, tc.function.name, args);
        toolResults.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      // Continue conversation with tool results
      const nextMessages = [
        ...aiMessages,
        assistantMessage,
        ...toolResults,
      ];

      const nextResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: nextMessages, tools, temperature, max_tokens: maxTokens }),
      });

      if (!nextResponse.ok) throw new Error("AI follow-up error");
      aiData = await nextResponse.json();
      assistantMessage = aiData.choices?.[0]?.message;
    }

    const answer = assistantMessage?.content || "I couldn't generate a response.";

    // Save messages to conversation if conversation_id provided
    if (conversation_id) {
      const userMsg = messages[messages.length - 1];
      await supabaseAdmin.from("chat_messages").insert([
        { conversation_id, role: "user", content: userMsg.content },
        { conversation_id, role: "assistant", content: answer, tool_calls: assistantMessage?.tool_calls || null },
      ]);
      await supabaseAdmin.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation_id);
    }

    return new Response(JSON.stringify({ answer, tool_calls: assistantMessage?.tool_calls }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
