
import { useEffect, useState } from "react";
import { Calendar, Check, X } from "lucide-react";
import NavBar from "@/components/NavBar";
import DashboardCard from "@/components/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Types for the data
interface StudentDataType {
  id: string;
  name: string;
  className: string;
  attendanceRate: string;
  present: number;
  absent: number;
  attendanceHistory: Array<{ date: string; status: string }>;
  courses: Array<{ name: string; teacher: string; attendanceRate: string }>;
}

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState<StudentDataType>({
    id: "",
    name: "Loading...",
    className: "...",
    attendanceRate: "...",
    present: 0,
    absent: 0,
    attendanceHistory: [],
    courses: [],
  });
  
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // First, fetch all students
  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'student');
          
        if (error) throw error;
        
        setAllStudents(data || []);
        
        // Select the first student by default
        if (data && data.length > 0 && !selectedStudent) {
          setSelectedStudent(data[0].id);
          await fetchStudentDetails(data[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        setIsLoading(false);
      }
    };
    
    fetchAllStudents();
  }, []);
  
  const fetchStudentDetails = async (studentId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch the student
      const { data: student, error: studentError } = await supabase
        .from('users')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (studentError) throw studentError;
      
      // Get classes the student is enrolled in
      const { data: classEnrollments, error: enrollmentError } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', studentId);
      
      if (enrollmentError) throw enrollmentError;
      
      // Get class details
      const classIds = classEnrollments?.map(enrollment => enrollment.class_id) || [];
      
      // Get attendance records
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('date, status, class_id')
        .eq('student_id', studentId);
      
      if (attendanceError) throw attendanceError;
      
      // Get class names
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name, teacher_id')
        .in('id', classIds);
      
      if (classesError) throw classesError;
      
      // Get teacher names for classes
      const teacherIds = classesData?.map(c => c.teacher_id).filter(Boolean) || [];
      const { data: teachers, error: teachersError } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', teacherIds);
      
      if (teachersError) throw teachersError;
      
      // Calculate attendance metrics
      const present = attendanceRecords?.filter(record => record.status === 'present').length || 0;
      const absent = attendanceRecords?.filter(record => record.status === 'absent').length || 0;
      const total = present + absent;
      const attendanceRate = total > 0 
        ? Math.round((present / total) * 100) + "%" 
        : "N/A";
      
      // Format attendance history
      const attendanceHistory = attendanceRecords?.map(record => ({
        date: record.date,
        status: record.status === 'present' ? 'Present' : 'Absent'
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7) || [];
      
      // Format courses
      const courses = classesData?.map(classItem => {
        // Find teacher for this class
        const teacher = teachers?.find(t => t.id === classItem.teacher_id);
        const teacherName = teacher 
          ? `${teacher.first_name} ${teacher.last_name}` 
          : "Unassigned";
          
        // Calculate class-specific attendance
        const classAttendance = attendanceRecords?.filter(record => record.class_id === classItem.id) || [];
        const classPresent = classAttendance.filter(record => record.status === 'present').length;
        const classTotal = classAttendance.length;
        const classRate = classTotal > 0 
          ? Math.round((classPresent / classTotal) * 100) + "%" 
          : "N/A";
        
        return {
          name: classItem.name,
          teacher: teacherName,
          attendanceRate: classRate
        };
      }) || [];
      
      // Update state
      setStudentData({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        className: classesData && classesData.length > 0 ? classesData[0].name : "No Class",
        attendanceRate,
        present,
        absent,
        attendanceHistory,
        courses
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setIsLoading(false);
    }
  };

  // When selected student changes, fetch their details
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDetails(selectedStudent);
    }
  }, [selectedStudent]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userRole="student" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <p className="text-gray-500">
            Welcome, {studentData.name} - {studentData.className}
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
              {isLoading ? (
                <p className="text-center py-4 text-gray-500">Loading attendance history...</p>
              ) : studentData.attendanceHistory.length > 0 ? (
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
              ) : (
                <p className="text-center py-4 text-gray-500">No attendance records found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-4 text-gray-500">Loading courses...</p>
              ) : studentData.courses.length > 0 ? (
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
              ) : (
                <p className="text-center py-4 text-gray-500">No courses found</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* All Students Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Students</CardTitle>
            </CardHeader>
            <CardContent>
              {allStudents.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No students found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allStudents.map((student) => (
                      <TableRow key={student.id} className={selectedStudent === student.id ? "bg-muted/50" : ""}>
                        <TableCell className="font-mono text-xs">{student.id}</TableCell>
                        <TableCell>{student.first_name} {student.last_name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;