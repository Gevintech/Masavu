import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Activate from "./pages/Activate";
import Referrals from "./pages/Referrals";
import Withdraw from "./pages/Withdraw";
import TransactionHistory from "./pages/TransactionHistory";
import EarnYouTube from "./pages/EarnYouTube";
import EarnTikTok from "./pages/EarnTikTok";
import EarnQuiz from "./pages/EarnQuiz";
import EarnDaily from "./pages/EarnDaily";
import EarnAviator from "./pages/EarnAviator";
import EarnMath from "./pages/EarnMath";
import ApplyLoan from "./pages/ApplyLoan";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/activate" element={<Activate />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/earn/youtube" element={<EarnYouTube />} />
          <Route path="/earn/tiktok" element={<EarnTikTok />} />
          <Route path="/earn/quiz" element={<EarnQuiz />} />
          <Route path="/earn/daily" element={<EarnDaily />} />
          <Route path="/earn/aviator" element={<EarnAviator />} />
          <Route path="/earn/math" element={<EarnMath />} />
          <Route path="/apply-loan" element={<ApplyLoan />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

