
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/auth";
import { toast } from "sonner";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

const NavLink = ({ to, children, className }: NavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={cn(
        "px-4 py-2 rounded-md transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-muted",
        className
      )}
    >
      {children}
    </Link>
  );
};

interface NavBarProps {
  userRole: "principal" | "teacher" | "student";
}

const NavBar = ({ userRole }: NavBarProps) => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error("Error signing out: " + error.message);
      } else {
        toast.success("You have been logged out");
        navigate("/auth");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred while logging out");
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary">
                Attendance System
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {userRole === "principal" && (
                <>
                  <NavLink to="/dashboard/principal">Dashboard</NavLink>
                  <NavLink to="/view-attendance">Attendance</NavLink>
                  <NavLink to="/classes-students">Classes & Students</NavLink>
                </>
              )}
              
              {userRole === "teacher" && (
                <>
                  <NavLink to="/dashboard/teacher">Dashboard</NavLink>
                  <NavLink to="/classes-students">Classes & Students</NavLink>
                  <NavLink to="/view-attendance">View Attendance</NavLink>
                </>
              )}
              
              {userRole === "student" && (
                <>
                  <NavLink to="/dashboard/student">Dashboard</NavLink>
                  <NavLink to="/my-attendance">My Attendance</NavLink>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium capitalize">
                {profile ? `${profile.first_name} (${userRole})` : userRole}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600">
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;