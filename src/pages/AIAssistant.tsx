import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import {
  Bot, Send, Loader2, Plus, MessageSquare, Trash2, Sparkles,
  BarChart3, Users, CreditCard, FolderKanban, Mail, Zap,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      .select().single();
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

    let convId = activeConvId;
    let isNewConv = false;
    if (!convId && user) {
      const { data } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, title: userMessage.slice(0, 60) })
        .select().single();
      if (data) {
        convId = (data as any).id;
        isNewConv = true;
        setConversations(prev => [(data as any as Conversation), ...prev]);
        setActiveConvId(convId);
      }
    }

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { messages: newMessages, conversation_id: convId, page_context: location.pathname },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);

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
    { label: "Revenue Overview", cmd: "/show_revenue", icon: BarChart3 },
    { label: "Top Leads", cmd: "Show my highest priority leads", icon: Zap },
    { label: "Pending Payments", cmd: "Which clients have pending payments?", icon: CreditCard },
    { label: "Near Deadline", cmd: "Which projects are near deadline?", icon: FolderKanban },
    { label: "Pipeline Status", cmd: "/show_pipeline", icon: Users },
    { label: "Email Stats", cmd: "Show my email sending statistics", icon: Mail },
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0 overflow-hidden rounded-xl border bg-card">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 flex flex-col border-r overflow-hidden"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <span className="font-semibold text-sm">Conversations</span>
              <Button size="icon" variant="ghost" onClick={createConversation} className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {loadingConvs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map(c => (
                    <div
                      key={c.id}
                      className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-all duration-150 ${
                        activeConvId === c.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      }`}
                      onClick={() => setActiveConvId(c.id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      <span className="truncate flex-1">{c.title}</span>
                      <Button
                        size="icon" variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center gap-3">
          <Button
            size="icon" variant="ghost" className="h-8 w-8 shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
            <Bot className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm leading-tight">Aivants AI Assistant</h2>
            <p className="text-xs text-muted-foreground truncate">Query your business data in natural language</p>
          </div>
          <div className="ml-auto">
            <Badge variant="outline" className="text-xs gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
              Online
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center gap-8 py-16"
              >
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-success flex items-center justify-center">
                    <Zap className="h-3 w-3 text-success-foreground" />
                  </div>
                </div>

                <div className="text-center space-y-2 max-w-md">
                  <h3 className="text-xl font-semibold">How can I help you today?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I can analyze your leads, clients, revenue, projects, and pipeline data. Ask me anything or try one of the suggestions below.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-lg">
                  {quickCommands.map(q => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={q.label}
                        onClick={() => setInput(q.cmd)}
                        className="flex items-center gap-2.5 p-3 rounded-xl border bg-background hover:bg-muted/80 hover:border-primary/20 transition-all duration-150 text-left group"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        <span className="text-xs font-medium leading-tight">{q.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-5">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {m.role === "assistant" && (
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}>
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 leading-relaxed">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Ask about leads, clients, revenue, projects..."
                  className="pr-4 h-11 text-sm rounded-xl"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                size="icon"
                className="h-11 w-11 rounded-xl shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              AI responses may not always be accurate. Verify important data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
