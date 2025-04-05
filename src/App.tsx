
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import TakeAttendance from "./pages/TakeAttendance";
import ClassesStudents from "./pages/ClassesStudents";
import ViewAttendance from "./pages/ViewAttendance";
import RoleSelect from "./pages/RoleSelect";
import { AuthProvider } from "./integrations/supabase/auth";
import React from "react";

// Create a new QueryClient instance outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/role-select" element={<RoleSelect />} />
                <Route path="/dashboard/:role" element={<Dashboard />} />
                <Route path="/take-attendance" element={<TakeAttendance />} />
                <Route path="/take-attendance/:classId" element={<TakeAttendance />} />
                <Route path="/classes-students" element={<ClassesStudents />} />
                <Route path="/view-attendance" element={<ViewAttendance />} />
                <Route path="/view-attendance/:classId" element={<ViewAttendance />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;