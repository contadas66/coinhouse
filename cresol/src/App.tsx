
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import SmsPage from "./pages/SmsPage";
import TokenPage from "./pages/TokenPage";
import WaitPage from "./pages/WaitPage";
import VisitasPage from "./pages/VisitasPage";
import CadastroPage from "./pages/CadastroPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Index />} />
          <Route path="/sms" element={<SmsPage />} />
          <Route path="/token" element={<TokenPage />} />
          <Route path="/wait" element={<WaitPage />} />
          <Route path="/visitas" element={<VisitasPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
