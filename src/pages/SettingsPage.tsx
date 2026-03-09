import { useState } from "react";
import { SettingsLayout, type SettingsSection } from "@/components/settings/SettingsLayout";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { AISettingsSection } from "@/components/AISettingsSection";
import { EmailSettings } from "@/components/settings/EmailSettings";
import { TelegramSettings } from "@/components/settings/TelegramSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { AutomationSettings } from "@/components/settings/AutomationSettings";
import { WebhookSettings } from "@/components/settings/WebhookSettings";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";
import { UsersPermissionsSettings } from "@/components/settings/UsersPermissionsSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { DeveloperSettings } from "@/components/settings/DeveloperSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { Sparkles } from "lucide-react";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-6">
            <GeneralSettings />
            <AccountSettings />
          </div>
        );
      case "ai":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />AI & Model APIs
              </h1>
              <p className="text-muted-foreground text-sm">Configure AI providers, models, and behavior</p>
            </div>
            <AISettingsSection />
          </div>
        );
      case "email":
        return <EmailSettings />;
      case "telegram":
        return <TelegramSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "automations":
        return <AutomationSettings />;
      case "webhooks":
        return <WebhookSettings />;
      case "integrations":
        return <IntegrationSettings />;
      case "users":
        return <UsersPermissionsSettings />;
      case "security":
        return <SecuritySettings />;
      case "developer":
        return <DeveloperSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <SettingsLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection()}
    </SettingsLayout>
  );
}
