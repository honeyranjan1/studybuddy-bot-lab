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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-3 md:px-5">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden sm:block h-5 w-px bg-border" />
              <h1 className="font-display font-semibold text-sm md:text-base text-foreground truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search topics, notes..."
                  className="pl-9 h-9 w-56 lg:w-72 bg-secondary/60 border-transparent focus-visible:bg-card focus-visible:border-border"
                />
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
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
