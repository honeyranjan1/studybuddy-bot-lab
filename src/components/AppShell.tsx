import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import UserDropdown from "./UserDropdown";
import ThemeToggle from "./ThemeToggle";
import { Input } from "@/components/ui/input";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tools": "Study Tools",
  "/notes": "Notes Generator",
  "/flashcards": "Flashcards",
  "/quiz": "Quiz Generator",
  "/pdf-summary": "PDF Summary",
  "/placement": "Placement Mode",
  "/partners": "Study Partners",
  "/chat": "AI Tutor",
  "/profile": "Profile",
  "/exam-countdown": "Exam Countdown",
};

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const title = routeTitles[location.pathname] || "StudyBuddy";

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-bg-base">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-black/5 bg-bg-base/80 backdrop-blur-xl px-4 md:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="text-[#6a6a6a] hover:text-[#1a1a1a]" />
              <div className="hidden sm:block h-5 w-px bg-black/10" />
              <h1 className="font-display font-medium text-base md:text-lg text-[#1a1a1a] truncate lowercase tracking-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
                <Input
                  placeholder="search…"
                  className="pl-9 h-10 w-56 lg:w-72 bg-white/70 border-black/5 rounded-full focus-visible:bg-white focus-visible:border-black/20 lowercase"
                />
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-[#6a6a6a] hover:text-[#1a1a1a] hover:bg-white/70">
                <Bell className="w-4 h-4" />
              </Button>
              <UserDropdown />
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppShell;
