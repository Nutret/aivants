import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Settings, Sparkles, Mail, MessageCircle, Bell, Zap, Link2,
  Users, Shield, Code, Globe, Webhook
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const settingsSections = [
  { id: "general", label: "General", icon: Globe },
  { id: "ai", label: "AI & Model APIs", icon: Sparkles },
  { id: "email", label: "Email & Messaging", icon: Mail },
  { id: "telegram", label: "Telegram Bot", icon: MessageCircle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "automations", label: "Automation Rules", icon: Zap },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "users", label: "Users & Permissions", icon: Users },
  { id: "security", label: "Security", icon: Shield },
  { id: "developer", label: "Developer Mode", icon: Code },
] as const;

export type SettingsSection = typeof settingsSections[number]["id"];

interface SettingsLayoutProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  children: React.ReactNode;
}

export function SettingsLayout({ activeSection, onSectionChange, children }: SettingsLayoutProps) {
  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <div className="w-56 shrink-0">
        <div className="sticky top-4">
          <div className="flex items-center gap-2 mb-4 px-3">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Settings</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <nav className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors text-left",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl pb-12">
        {children}
      </div>
    </div>
  );
}
