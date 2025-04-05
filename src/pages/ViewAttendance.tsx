import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ViewAttendance = () => {
  const navigate = useNavigate();
  const { classId: urlClassId } = useParams<{ classId: string }>();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(urlClassId || null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Update selected class when URL parameter changes
  useEffect(() => {
    if (urlClassId) {
      setSelectedClassId(urlClassId);
    }
  }, [urlClassId]);

  // Fetch classes taught by the teacher
  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['teacherClasses'],
    queryFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        toast.error("Authentication error. Please sign in again.");
        return [];
      }
      
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', authData.user.id);
      
      if (error) {
        toast.error("Failed to load classes: " + error.message);
        return [];
      }
      
      return data;
    }
  });

  // Set first class as selected once loaded if none is selected
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
      navigate(`/view-attendance/${classes[0].id}`);
    }
  }, [classes, selectedClassId, navigate]);

  // Fetch attendance records for the selected class and date
  const { data: attendanceRecords, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', selectedClassId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!selectedClassId) return [];
      
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('id, student_id, status')
        .eq('class_id', selectedClassId)
        .eq('date', formattedDate);
      
      if (error) {
        toast.error("Failed to load attendance: " + error.message);
        return [];
      }
      
      return data;
    },
    enabled: !!selectedClassId
  });

  // Fetch students for the selected class
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['classStudents', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      
      console.log("Fetching students for class ID:", selectedClassId);
      
      // First get all student IDs in this class
      const { data: classStudentsData, error: classStudentsError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', selectedClassId);
      
      if (classStudentsError) {
        console.error("Error loading class students:", classStudentsError);
        toast.error("Failed to load class students: " + classStudentsError.message);
        return [];
      }
      
      console.log("Retrieved class student IDs:", classStudentsData);
      
      if (!classStudentsData || classStudentsData.length === 0) {
        return [];
      }
      
      // Extract student IDs
      const studentIds = classStudentsData.map(item => item.student_id);
      
      // Then get student details from users table
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', studentIds);
      
      if (studentsError) {
        console.error("Error loading student details:", studentsError);
        toast.error("Failed to load student details: " + studentsError.message);
        return [];
      }
      
      console.log("Retrieved student details:", studentsData);
      
      // Map to the expected format
      return studentsData.map(item => ({
        id: item.id,
        firstName: item.first_name,
        lastName: item.last_name,
        fullName: `${item.first_name} ${item.last_name}`
      }));
    },
    enabled: !!selectedClassId
  });

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    navigate(`/view-attendance/${classId}`);
  };

  // Calculate attendance statistics
  const attendanceStats = {
    totalStudents: students?.length || 0,
    presentCount: attendanceRecords?.filter(record => record.status === 'present').length || 0,
    absentCount: attendanceRecords?.filter(record => record.status === 'absent').length || 0,
    attendanceRate: students?.length 
      ? Math.round(((attendanceRecords?.filter(record => record.status === 'present').length || 0) / students.length) * 100)
      : 0
  };

  // Map attendance records to student IDs for easy lookup
  const attendanceMap = attendanceRecords?.reduce((acc, record) => {
    acc[record.student_id] = record.status;
    return acc;
  }, {} as Record<string, string>) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userRole="teacher" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">View Attendance</h1>
            <p className="text-gray-500">View and track student attendance</p>
          </div>
          <Button 
            onClick={() => navigate('/classes-students')} 
            variant="outline"
          >
            Manage Classes & Students
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Class</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={selectedClassId || ""} 
                  onValueChange={handleClassChange}
                  disabled={loadingClasses}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Students:</span>
                    <span className="font-medium">{students?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Present:</span>
                    <span className="font-medium text-green-600">{attendanceRecords?.filter(record => record.status === 'present').length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Absent:</span>
                    <span className="font-medium text-red-600">{attendanceRecords?.filter(record => record.status === 'absent').length || 0}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Attendance Rate:</span>
                      <span className="font-medium">
                        {students?.length 
                          ? Math.round(((attendanceRecords?.filter(record => record.status === 'present').length || 0) / students.length) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  Attendance for {classes?.find(c => c.id === selectedClassId)?.name || "Class"} 
                  on {format(selectedDate, "MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStudents || loadingAttendance ? (
                  <p className="text-gray-500">Loading attendance data...</p>
                ) : students && students.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-2 font-medium">Student Name</th>
                          <th className="pb-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(student => {
                          // Create a map of student IDs to attendance status for easy lookup
                          const attendanceMap = attendanceRecords?.reduce((acc, record) => {
                            acc[record.student_id] = record.status;
                            return acc;
                          }, {} as Record<string, string>) || {};
                          
                          return (
                            <tr key={student.id} className="border-b">
                              <td className="py-3">{student.fullName}</td>
                              <td className="py-3">
                                {attendanceMap[student.id] ? (
                                  <span 
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      attendanceMap[student.id] === 'present' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {attendanceMap[student.id] === 'present' ? 'Present' : 'Absent'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Not recorded</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <h3 className="text-lg font-medium text-gray-500">No students found</h3>
                    <p className="text-gray-400 mt-1">
                      {selectedClassId 
                        ? "There are no students in this class yet." 
                        : "Please select a class to view attendance records."}
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate('/classes-students')}
                    >
                      Manage Students
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewAttendance;