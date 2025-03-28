
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, UserCheck } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-primary">College Attendance System</h1>
          <p className="text-gray-500 mt-2">Simplifying attendance tracking for College</p>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to the College Attendance System</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Access your dashboard based on your role. Track attendance, view reports, and manage student records all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center text-primary">
                <UserCheck className="mr-2 h-5 w-5" />
                Principal Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6">
                Access College-wide attendance data, view reports, and monitor attendance rates across classes.
              </p>
              <Button 
                className="w-full" 
                onClick={() => navigate('/dashboard/principal')}
              >
                Enter as Principal
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center text-secondary">
                <Calendar className="mr-2 h-5 w-5" />
                Teacher Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6">
                Take attendance for your classes, view student attendance history, and track absences.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-secondary text-secondary hover:bg-secondary hover:text-white" 
                onClick={() => navigate('/dashboard/teacher')}
              >
                Enter as Teacher
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center text-purple-600">
                <Users className="mr-2 h-5 w-5" />
                Student Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6">
                Check your attendance record, view course attendance rates, and track your attendance history.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white" 
                onClick={() => navigate('/dashboard/student')}
              >
                Enter as Student
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">
            College Attendance System © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
