import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Chat from "./pages/Chat.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Quiz from "./pages/Quiz.tsx";
import NotesGenerator from "./pages/NotesGenerator.tsx";
import Flashcards from "./pages/Flashcards.tsx";
import PdfSummary from "./pages/PdfSummary.tsx";
import Placement from "./pages/Placement.tsx";
import Partners from "./pages/Partners.tsx";
import ExamCountdown from "./pages/ExamCountdown.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Profile from "./pages/Profile.tsx";
import Navbar from "./components/Navbar.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const WithNav = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    {children}
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat" element={<ProtectedRoute><WithNav><Chat /></WithNav></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><WithNav><Dashboard /></WithNav></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><WithNav><Quiz /></WithNav></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><WithNav><NotesGenerator /></WithNav></ProtectedRoute>} />
            <Route path="/flashcards" element={<ProtectedRoute><WithNav><Flashcards /></WithNav></ProtectedRoute>} />
            <Route path="/pdf-summary" element={<ProtectedRoute><WithNav><PdfSummary /></WithNav></ProtectedRoute>} />
            <Route path="/placement" element={<ProtectedRoute><WithNav><Placement /></WithNav></ProtectedRoute>} />
            <Route path="/partners" element={<ProtectedRoute><WithNav><Partners /></WithNav></ProtectedRoute>} />
            <Route path="/exam-countdown" element={<ProtectedRoute><WithNav><ExamCountdown /></WithNav></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><WithNav><Profile /></WithNav></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
