
import { Calendar, Users } from "lucide-react";
import NavBar from "@/components/NavBar";
import DashboardCard from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  
  // Mock data - in a real app this would come from an API
  const teacherData = {
    classes: [
      { id: "10A", name: "Class 10A", studentsCount: 30, attendanceRate: "96%" },
      { id: "11B", name: "Class 11B", studentsCount: 28, attendanceRate: "94%" },
      { id: "9C", name: "Class 9C", studentsCount: 32, attendanceRate: "90%" },
    ],
    todaysClasses: [
      { id: "10A", name: "Class 10A", time: "09:00 AM", attendanceStatus: "Taken" },
      { id: "9C", name: "Class 9C", time: "11:30 AM", attendanceStatus: "Pending" },
      { id: "11B", name: "Class 11B", time: "02:00 PM", attendanceStatus: "Pending" },
    ],
    recentAbsences: [
      { name: "John Smith", class: "10A", consecutiveDays: 2 },
      { name: "Mary Johnson", class: "11B", consecutiveDays: 1 },
      { name: "Robert Brown", class: "9C", consecutiveDays: 3 },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userRole="teacher" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <p className="text-gray-500">Manage your classes and attendance</p>
          </div>
          <Button onClick={() => navigate('/take-attendance')}>
            Take Attendance
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {teacherData.classes.map((classItem) => (
            <DashboardCard
              key={classItem.id}
              title={classItem.name}
              value={classItem.studentsCount}
              description={`${classItem.attendanceRate} attendance rate`}
              icon={<Users className="h-4 w-4" />}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teacherData.todaysClasses.map((cls) => (
                  <div key={cls.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-gray-500">{cls.time}</p>
                    </div>
                    {cls.attendanceStatus === "Pending" ? (
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/take-attendance/${cls.id}`)}
                      >
                        Take Attendance
                      </Button>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                        {cls.attendanceStatus}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Absences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teacherData.recentAbsences.map((absence, i) => (
                  <div key={i} className="flex justify-between items-center border-b py-2 last:border-0">
                    <div>
                      <p className="font-medium">{absence.name}</p>
                      <p className="text-sm text-gray-500">Class {absence.class}</p>
                    </div>
                    <div className="text-sm text-red-500">
                      {absence.consecutiveDays} {absence.consecutiveDays === 1 ? 'day' : 'days'} absent
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
