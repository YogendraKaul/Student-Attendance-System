
import { Calendar, CheckCircle, Users } from "lucide-react";
import NavBar from "@/components/NavBar";
import DashboardCard from "@/components/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrincipalDashboard = () => {
  // In a real app, this would come from an API
  const attendanceData = {
    totalStudents: 450,
    presentToday: 430,
    absentToday: 20,
    attendanceRate: "95.6%",
    recentAbsences: [
      { name: "Yogendra Kaul", class: "CSD", date: "2023-05-15" },
      { name: "Sumit Sahu", class: "CSD", date: "2023-05-15" },
      { name: "Saurabh Sharma", class: "CSA", date: "2023-05-14" },
    ],
    classAttendance: [
      { class: "8A", rate: "98%" },
      { class: "9B", rate: "94%" },
      { class: "10C", rate: "97%" },
      { class: "11D", rate: "92%" },
      { class: "12A", rate: "95%" },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userRole="principal" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Principal Dashboard</h1>
          <p className="text-gray-500">Overview of College attendance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <DashboardCard
            title="Total Students"
            value={attendanceData.totalStudents}
            description="Enrolled across all classes"
            icon={<Users />}
          />
          <DashboardCard
            title="Present Today"
            value={attendanceData.presentToday}
            description={`${attendanceData.absentToday} students absent`}
            icon={<CheckCircle />}
          />
          <DashboardCard
            title="Attendance Rate"
            value={attendanceData.attendanceRate}
            description="School-wide average"
            icon={<Calendar />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Absences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attendanceData.recentAbsences.map((absence, i) => (
                  <div key={i} className="flex justify-between items-center border-b py-2 last:border-0">
                    <div>
                      <p className="font-medium">{absence.name}</p>
                      <p className="text-sm text-gray-500">Class {absence.class}</p>
                    </div>
                    <div className="text-sm text-gray-500">{absence.date}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Class Attendance Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attendanceData.classAttendance.map((classItem, i) => (
                  <div key={i} className="flex justify-between items-center border-b py-2 last:border-0">
                    <div>
                      <p className="font-medium">Class {classItem.class}</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: classItem.rate }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{classItem.rate}</span>
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

export default PrincipalDashboard;
