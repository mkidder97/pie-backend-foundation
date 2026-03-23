import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PieLayout from "@/components/pie/PieLayout";
import CategoryPage from "@/pages/CategoryPage";
import Tools from "@/pages/Tools";
import Creators from "@/pages/Creators";
import Admin from "@/pages/Admin";
import SavedBriefs from "@/pages/SavedBriefs";
import Preferences from "@/pages/Preferences";
import NotFound from "@/pages/NotFound";
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
            <Route path="/" element={<Navigate to="/all" replace />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/saved" element={<SavedBriefs />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/:category" element={<CategoryPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
