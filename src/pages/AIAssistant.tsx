import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import {
  Bot, Send, Loader2, Plus, MessageSquare, Trash2, Sparkles,
} from "lucide-react";
import { useLocation } from "react-router-dom";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; updated_at: string };

export default function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      setConversations((data as any) || []);
      setLoadingConvs(false);
    })();
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", activeConvId)
        .order("created_at", { ascending: true });
      setMessages((data as any as Message[]) || []);
    })();
  }, [activeConvId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConversation = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, title: "New Chat" })
      .select()
      .single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const conv = data as any as Conversation;
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(conv.id);
    setMessages([]);
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("chat_conversations").delete().eq("id", id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");

    // Auto-create conversation if none active
    let convId = activeConvId;
    if (!convId && user) {
      const { data } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, title: userMessage.slice(0, 60) })
        .select()
        .single();
      if (data) {
        convId = (data as any).id;
        setActiveConvId(convId);
        setConversations(prev => [(data as any as Conversation), ...prev]);
      }
    }

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          messages: newMessages,
          conversation_id: convId,
          page_context: location.pathname,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);

      // Update conversation title from first message
      if (newMessages.length === 1 && convId) {
        await supabase.from("chat_conversations").update({ title: userMessage.slice(0, 60) }).eq("id", convId);
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: userMessage.slice(0, 60) } : c));
      }
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const quickCommands = [
    { label: "Revenue", cmd: "/show_revenue" },
    { label: "Top Leads", cmd: "Show my highest priority leads" },
    { label: "Pending Payments", cmd: "Which clients have pending payments?" },
    { label: "Near Deadline", cmd: "Which projects are near deadline?" },
    { label: "Pipeline", cmd: "/show_pipeline" },
    { label: "Email Stats", cmd: "Show my email sending statistics" },
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4">
      {/* Sidebar - Conversations */}
      <div className="w-64 shrink-0 flex flex-col border rounded-lg bg-card">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">Chats</span>
          <Button size="icon" variant="ghost" onClick={createConversation} className="h-7 w-7">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loadingConvs ? (
              <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
            ) : (
              conversations.map(c => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${activeConvId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  onClick={() => setActiveConvId(c.id)}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{c.title}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col border rounded-lg bg-card">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Aivants AI Command Assistant</h2>
            <p className="text-xs text-muted-foreground">Ask anything about your business data</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">How can I help?</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  I can query your leads, clients, revenue, projects, and more. Try a command below or ask anything.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {quickCommands.map(q => (
                  <Badge
                    key={q.label}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5"
                    onClick={() => { setInput(q.cmd); }}
                  >
                    {q.label}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask about leads, clients, revenue, projects..."
              className="text-sm"
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
