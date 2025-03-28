
import { Calendar, Check, X } from "lucide-react";
import NavBar from "@/components/NavBar";
import DashboardCard from "@/components/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StudentDashboard = () => {
  // Mock data - would come from API in real app
  const studentData = {
    name: "Alex Johnson",
    class: "10A",
    attendanceRate: "95%",
    present: 57,
    absent: 3,
    attendanceHistory: [
      { date: "2023-05-15", status: "Present" },
      { date: "2023-05-14", status: "Present" },
      { date: "2023-05-13", status: "Absent" },
      { date: "2023-05-12", status: "Present" },
      { date: "2023-05-11", status: "Present" },
      { date: "2023-05-10", status: "Present" },
      { date: "2023-05-09", status: "Present" },
    ],
    courses: [
      { name: "Mathematics", teacher: "Mr. Smith", attendanceRate: "98%" },
      { name: "Science", teacher: "Mrs. Johnson", attendanceRate: "96%" },
      { name: "English", teacher: "Ms. Davis", attendanceRate: "92%" },
      { name: "History", teacher: "Mr. Wilson", attendanceRate: "94%" },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userRole="student" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <p className="text-gray-500">
            Welcome, {studentData.name} - Class {studentData.class}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <DashboardCard
            title="Attendance Rate"
            value={studentData.attendanceRate}
            description="Overall attendance"
            icon={<Calendar className="h-4 w-4" />}
          />
          <DashboardCard
            title="Days Present"
            value={studentData.present}
            description="This semester"
            icon={<Check className="h-4 w-4" />}
          />
          <DashboardCard
            title="Days Absent"
            value={studentData.absent}
            description="This semester"
            icon={<X className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {studentData.attendanceHistory.map((day, i) => (
                  <div key={i} className="flex justify-between items-center border-b py-2 last:border-0">
                    <div className="text-sm">{day.date}</div>
                    <div>
                      {day.status === "Present" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md flex items-center">
                          <Check className="h-3 w-3 mr-1" />
                          Present
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-md flex items-center">
                          <X className="h-3 w-3 mr-1" />
                          Absent
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {studentData.courses.map((course, i) => (
                  <div key={i} className="flex justify-between items-center border-b py-2 last:border-0">
                    <div>
                      <p className="font-medium">{course.name}</p>
                      <p className="text-sm text-gray-500">{course.teacher}</p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{course.attendanceRate}</span> attendance
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

export default StudentDashboard;
