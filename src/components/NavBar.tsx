
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

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
                  <NavLink to="/reports">Reports</NavLink>
                  <NavLink to="/teachers">Teachers</NavLink>
                  <NavLink to="/classes">Classes</NavLink>
                </>
              )}
              
              {userRole === "teacher" && (
                <>
                  <NavLink to="/dashboard/teacher">Dashboard</NavLink>
                  <NavLink to="/take-attendance">Take Attendance</NavLink>
                  <NavLink to="/view-attendance">View Attendance</NavLink>
                  <NavLink to="/students">Students</NavLink>
                </>
              )}
              
              {userRole === "student" && (
                <>
                  <NavLink to="/dashboard/student">Dashboard</NavLink>
                  <NavLink to="/my-attendance">My Attendance</NavLink>
                  <NavLink to="/courses">My Courses</NavLink>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium capitalize">{userRole}</span>
            </div>
            <Button variant="ghost" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
