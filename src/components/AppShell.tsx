import UserDropdown from "./UserDropdown";
import ThemeToggle from "./ThemeToggle";
import { Input } from "@/components/ui/input";
import { Search, Bell, PanelsTopLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import PageScene3D from "./desk/PageScene3D";

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
    <div className="flex min-h-screen w-full bg-transparent">
      <PageScene3D />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-4 z-30 mx-3 mt-4 md:mx-6">
          <div className="glass flex h-14 items-center justify-between gap-3 rounded-full pl-2 pr-2 shadow-soft">
            <div className="flex min-w-0 items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="rounded-full px-3 text-muted-foreground hover:text-foreground">
                <Link to="/" aria-label="Back to 3D study desk">
                  <PanelsTopLeft className="size-4" />
                  <span className="hidden sm:inline">3D desk</span>
                </Link>
              </Button>
              <div className="hidden h-5 w-px bg-foreground/10 sm:block" />
              <h1 className="truncate font-display text-sm font-medium lowercase tracking-tight text-foreground md:text-base">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden md:flex">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="search…"
                  className="h-9 w-52 rounded-full border-border/40 bg-background/40 pl-9 lowercase focus-visible:bg-background/70 lg:w-64"
                />
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-accent/50 hover:text-foreground" aria-label="Notifications">
                <Bell className="size-4" />
              </Button>
              <UserDropdown />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden pt-4">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
