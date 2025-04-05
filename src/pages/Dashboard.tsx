
import { useParams, Navigate } from "react-router-dom";
import PrincipalDashboard from "@/components/dashboards/PrincipalDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import { toast } from "sonner";
import { useAuth } from "@/integrations/supabase/auth";
import { useEffect } from "react";

const Dashboard = () => {
  const { role } = useParams<{ role: string }>();
  const { user, profile, loading } = useAuth();
  
  useEffect(() => {
    if (user && profile && role !== profile.role) {
      toast.warning(`You're viewing the ${role} dashboard, but your role is ${profile.role}`);
    }
  }, [user, profile, role]);
  
  // If still loading auth state, show loading
  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    toast.error("Please login to access the dashboard");
    return <Navigate to="/auth" />;
  }
  
  // Log the role for debugging
  console.log("Current role:", role);
  console.log("User profile:", profile);
  
  switch (role) {
    case "principal":
      return <PrincipalDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "student":
      return <StudentDashboard />;
    default:
      // This helps with debugging if there's still an issue
      toast.error(`Invalid role: ${role}`);
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Role</h1>
          <p>The role "{role}" is not recognized.</p>
        </div>
      );
  }
};

export default Dashboard;