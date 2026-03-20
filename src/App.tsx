import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PieLayout from "@/components/pie/PieLayout";
import Dashboard from "@/pages/Dashboard";
import Feed from "@/pages/Feed";
import Build from "@/pages/Build";
import Horizon from "@/pages/Horizon";
import Tools from "@/pages/Tools";
import SearchPage from "@/pages/SearchPage";
import Relay from "@/pages/Relay";
import Creators from "@/pages/Creators";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<PieLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/build" element={<Build />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/relay" element={<Relay />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
