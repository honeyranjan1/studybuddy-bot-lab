import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import Index from "./pages/Index.tsx";
import Measured from "./pages/Measured.tsx";
import Chat from "./pages/Chat.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Quiz from "./pages/Quiz.tsx";
import NotesGenerator from "./pages/NotesGenerator.tsx";
import Flashcards from "./pages/Flashcards.tsx";
import PdfSummary from "./pages/PdfSummary.tsx";
import Placement from "./pages/Placement.tsx";
import DsaPractice from "./pages/DsaPractice.tsx";
import Partners from "./pages/Partners.tsx";
import ExamCountdown from "./pages/ExamCountdown.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Profile from "./pages/Profile.tsx";
import Tools from "./pages/Tools.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const Shell = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AppShell>{children}</AppShell></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Measured />} />
            <Route path="/home" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
            <Route path="/tools" element={<Shell><Tools /></Shell>} />
            <Route path="/chat" element={<Shell><Chat /></Shell>} />
            <Route path="/quiz" element={<Shell><Quiz /></Shell>} />
            <Route path="/notes" element={<Shell><NotesGenerator /></Shell>} />
            <Route path="/flashcards" element={<Shell><Flashcards /></Shell>} />
            <Route path="/pdf-summary" element={<Shell><PdfSummary /></Shell>} />
            <Route path="/placement" element={<Shell><Placement /></Shell>} />
            <Route path="/dsa-practice" element={<Shell><DsaPractice /></Shell>} />
            <Route path="/partners" element={<Shell><Partners /></Shell>} />
            <Route path="/exam-countdown" element={<Shell><ExamCountdown /></Shell>} />
            <Route path="/profile" element={<Shell><Profile /></Shell>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
