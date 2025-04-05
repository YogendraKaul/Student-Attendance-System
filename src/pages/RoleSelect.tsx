
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { UserCheck, Users, Calendar } from "lucide-react";

const RoleSelect = () => {
  const navigate = useNavigate();

  const handleSelectRole = (role: string) => {
    navigate(`/dashboard/${role}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <UserCheck className="h-8 w-8" />
            College Attendance System
          </h1>
          <p className="text-gray-500 mt-2">Select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => handleSelectRole("principal")}>
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center text-primary">
                <UserCheck className="mr-2 h-5 w-5" />
                Principal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6">
                Access college-wide attendance data, view reports, and monitor attendance rates.
              </p>
              <Button className="w-full">Continue as Principal</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectRole("teacher")}>
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center text-secondary">
                <Calendar className="mr-2 h-5 w-5" />
                Teacher
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6">
                Take attendance for your classes, view student attendance history, and track absences.
              </p>
              <Button variant="outline" 
                className="w-full border-secondary text-secondary hover:bg-secondary hover:text-white">
                Continue as Teacher
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectRole("student")}>
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center text-purple-600">
                <Users className="mr-2 h-5 w-5" />
                Student
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6">
                Check your attendance record, view course attendance rates, and track your attendance history.
              </p>
              <Button variant="outline" 
                className="w-full border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white">
                Continue as Student
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;