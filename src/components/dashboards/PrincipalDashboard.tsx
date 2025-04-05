
import { Calendar, CheckCircle, Users } from "lucide-react";
import NavBar from "@/components/NavBar";
import DashboardCard from "@/components/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";

// Interface for our attendance data
interface AttendanceData {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: string;
  recentAbsences: {
    name: string;
    class: string;
    date: string;
  }[];
  classAttendance: {
    id: string;
    name: string;
    rate: string;
  }[];
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  name: string;
}

const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch all students
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['allStudents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('role', 'student');
      
      if (error) throw error;
      
      return data.map(student => ({
        ...student,
        name: `${student.first_name} ${student.last_name}`
      }));
    }
  });
  
  // Fetch all classes
  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['allClasses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name');
      
      if (error) throw error;
      
      return data;
    }
  });
  
  // Fetch today's attendance
  const { data: todayAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['todayAttendance'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('date', today);
      
      if (error) throw error;
      
      return data;
    }
  });
  
  // Fetch recent absences
  const { data: recentAbsences, isLoading: loadingAbsences } = useQuery({
    queryKey: ['recentAbsences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          student_id,
          date,
          status,
          class_id
        `)
        .eq('status', 'absent')
        .order('date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return data;
    }
  });
  
  // Process the data to calculate attendance statistics
  const attendanceData = (() => {
    const totalStudents = students?.length || 0;
    const presentToday = todayAttendance?.filter(record => record.status === 'present').length || 0;
    const absentToday = todayAttendance?.filter(record => record.status === 'absent').length || 0;
    const attendanceRate = todayAttendance?.length 
      ? Math.round((presentToday / todayAttendance.length) * 100) + '%'
      : '0%';
    
    // Process recent absences
    const processedAbsences = recentAbsences?.map(absence => {
      const student = students?.find(s => s.id === absence.student_id);
      const classInfo = classes?.find(c => c.id === absence.class_id);
      
      return {
        name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
        class: classInfo?.name || 'Unknown Class',
        date: absence.date
      };
    }) || [];
    
    // Process class attendance rates
    const classAttendance = classes?.map(cls => {
      const classRecords = todayAttendance?.filter(record => record.class_id === cls.id) || [];
      const presentCount = classRecords.filter(record => record.status === 'present').length;
      const rate = classRecords.length 
        ? Math.round((presentCount / classRecords.length) * 100) + '%'
        : '0%';
      
      return {
        id: cls.id,
        name: cls.name,
        rate
      };
    }) || [];
    
    return {
      totalStudents,
      presentToday,
      absentToday,
      attendanceRate,
      recentAbsences: processedAbsences,
      classAttendance
    };
  })();

  const isLoading = loadingStudents || loadingClasses || loadingAttendance || loadingAbsences;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userRole="principal" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Principal Dashboard</h1>
          <p className="text-gray-500">
            Overview of College attendance
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <DashboardCard
            title="Total Students"
            value={isLoading ? '...' : attendanceData.totalStudents}
            description="Enrolled across all classes"
            icon={<Users className="h-4 w-4" />}
          />
          <DashboardCard
            title="Present Today"
            value={isLoading ? '...' : attendanceData.presentToday}
            description={isLoading ? 'Loading...' : `${attendanceData.absentToday} students absent`}
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <DashboardCard
            title="Attendance Rate"
            value={isLoading ? '...' : attendanceData.attendanceRate}
            description="School-wide average"
            icon={<Calendar className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Recent Absences</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/view-attendance')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-4 text-gray-500">Loading absence data...</p>
              ) : attendanceData.recentAbsences.length > 0 ? (
                <div className="space-y-2">
                  {attendanceData.recentAbsences.map((absence, i) => (
                    <div key={i} className="flex justify-between items-center border-b py-2 last:border-0">
                      <div>
                        <p className="font-medium">{absence.name}</p>
                        <p className="text-sm text-gray-500">Class: {absence.class}</p>
                      </div>
                      <div className="text-sm text-gray-500">{absence.date}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No recent absences found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Class Attendance Rates</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/classes-students')}>
                Manage Classes
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-4 text-gray-500">Loading class data...</p>
              ) : attendanceData.classAttendance.length > 0 ? (
                <div className="space-y-2">
                  {attendanceData.classAttendance.map((classItem, i) => (
                    <div key={i} className="flex justify-between items-center border-b py-2 last:border-0">
                      <div>
                        <p className="font-medium">{classItem.name}</p>
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
              ) : (
                <p className="text-center py-4 text-gray-500">No class attendance data found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Student List Section */}
        <div className="mb-8">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Students</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/classes-students')}>
                Manage Students
              </Button>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <p className="text-center py-4 text-gray-500">Loading students...</p>
              ) : students && students.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-xs">{student.id}</TableCell>
                        <TableCell>{student.first_name} {student.last_name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-gray-500">No students found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PrincipalDashboard;