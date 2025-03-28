
import { useParams, Navigate } from "react-router-dom";
import PrincipalDashboard from "@/components/dashboards/PrincipalDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import StudentDashboard from "@/components/dashboards/StudentDashboard";

const Dashboard = () => {
  const { role } = useParams<{ role: string }>();

  switch (role) {
    case "principal":
      return <PrincipalDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "student":
      return <StudentDashboard />;
    default:
      return <Navigate to="/role-select" replace />;
  }
};

export default Dashboard;
