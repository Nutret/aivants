import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Gear, Sparkle, Envelope, ChatCircle, Bell, Lightning, Link, 
  Users, ShieldCheck, Code, GlobeHemisphereWest, WebhooksLogo
} from "@phosphor-icons/react";
import { ScrollArea } from "@/components/ui/scroll-area";

const settingsSections = [
  { id: "general", label: "General", icon: GlobeHemisphereWest },
  { id: "ai", label: "AI & Model APIs", icon: Sparkle },
  { id: "email", label: "Email & Messaging", icon: Envelope },
  { id: "telegram", label: "Telegram Bot", icon: ChatCircle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "automations", label: "Automation Rules", icon: Lightning },
  { id: "webhooks", label: "Webhooks", icon: WebhooksLogo },
  { id: "integrations", label: "Integrations", icon: Link },
  { id: "users", label: "Users & Permissions", icon: Users },
  { id: "security", label: "Security", icon: ShieldCheck },
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
            <Gear weight="duotone" className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg tracking-tight">Settings</h2>
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
                      "flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-xl transition-all duration-200 text-left active:scale-[0.98]",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon weight="duotone" className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-colors", 
                        activeSection === section.id ? "text-primary" : "opacity-70"
                    )} />
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
