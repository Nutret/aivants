import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingAIWidget } from "@/components/FloatingAIWidget";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>("[data-search-trigger]")?.click();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-background px-4 gap-4">
            <SidebarTrigger />
            <div data-search-trigger>
              <GlobalSearch />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <FloatingAIWidget />
    </SidebarProvider>
  );
}
