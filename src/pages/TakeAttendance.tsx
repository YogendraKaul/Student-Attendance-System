
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Student {
  id: string;
  name: string;
  isPresent: boolean;
}

interface ClassInfo {
  id: string;
  name: string;
  date: string;
}

const TakeAttendance = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo>({
    id: classId || "",
    name: "",
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  
  // Fetch class details
  const { data: classData, isLoading: loadingClass } = useQuery({
    queryKey: ['class', classId],
    queryFn: async () => {
      if (!classId) return null;
      
      console.log("Fetching class data for class ID:", classId);
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();
      
      if (error) {
        console.error("Error loading class details:", error);
        toast({
          title: "Error",
          description: "Failed to load class details: " + error.message,
          variant: "destructive"
        });
        return null;
      }
      
      console.log("Class data retrieved:", data);
      return data;
    },
    enabled: !!classId
  });
  
  // First fetch student IDs for this class
  const { data: studentIds, isLoading: loadingStudentIds } = useQuery({
    queryKey: ['studentIds', classId],
    queryFn: async () => {
      if (!classId) return [];
      
      console.log("Fetching student IDs for class ID:", classId);
      
      const { data, error } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId);
      
      if (error) {
        console.error("Error loading student IDs:", error);
        toast({
          title: "Error",
          description: "Failed to load student IDs: " + error.message,
          variant: "destructive"
        });
        return [];
      }
      
      console.log("Student IDs retrieved:", data);
      return data.map(item => item.student_id);
    },
    enabled: !!classId
  });
  
  // Then fetch student details using the student IDs
  const { data: studentDetails, isLoading: loadingStudentDetails } = useQuery({
    queryKey: ['studentDetails', studentIds],
    queryFn: async () => {
      if (!studentIds || studentIds.length === 0) return [];
      
      console.log("Fetching student details for IDs:", studentIds);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', studentIds);
      
      if (error) {
        console.error("Error loading student details:", error);
        toast({
          title: "Error",
          description: "Failed to load student details: " + error.message,
          variant: "destructive"
        });
        return [];
      }
      
      console.log("Student details retrieved:", data);
      
      // Map the student data to the required format
      return data.map(student => ({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        isPresent: true
      }));
    },
    enabled: !!(studentIds && studentIds.length > 0)
  });
  
  // Fetch existing attendance records for today
  const { data: existingAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', classId, classInfo.date],
    queryFn: async () => {
      if (!classId) return [];
      
      console.log("Fetching attendance records for class ID:", classId, "and date:", classInfo.date);
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('class_id', classId)
        .eq('date', classInfo.date);
      
      if (error) throw error;
      
      console.log("Attendance records retrieved:", data);
      return data;
    },
    enabled: !!classId
  });
  
  // Update class info when class data is loaded
  useEffect(() => {
    if (classData) {
      console.log("Setting class info from class data:", classData);
      setClassInfo(prev => ({
        ...prev,
        name: classData.name
      }));
    }
  }, [classData]);
  
  // Update students list when student details are loaded
  useEffect(() => {
    if (studentDetails && studentDetails.length > 0) {
      console.log("Setting students state with student details:", studentDetails);
      setStudents(studentDetails);
    }
  }, [studentDetails]);
  
  // Merge existing attendance records with students data
  useEffect(() => {
    if (existingAttendance?.length && students.length) {
      console.log("Merging attendance records with student data");
      const updatedStudents = [...students];
      
      existingAttendance.forEach(record => {
        const studentIndex = updatedStudents.findIndex(s => s.id === record.student_id);
        if (studentIndex >= 0) {
          updatedStudents[studentIndex].isPresent = record.status === 'present';
        }
      });
      
      console.log("Updated students with attendance data:", updatedStudents);
      setStudents(updatedStudents);
    }
  }, [existingAttendance, students]);

  const handleTogglePresence = (studentId: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, isPresent: !student.isPresent }
          : student
      )
    );
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((student) => ({ ...student, isPresent: true }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classId || students.length === 0) {
      toast({
        title: "Error",
        description: "No students to record attendance for",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Submitting attendance for class ID:", classId, "and date:", classInfo.date);
      console.log("Student attendance data:", students);
      
      // First delete any existing attendance records for today
      const { error: deleteError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('class_id', classId)
        .eq('date', classInfo.date);
        
      if (deleteError) {
        console.error("Error deleting existing attendance records:", deleteError);
        throw deleteError;
      }
      
      // Then insert the new attendance records
      const records = students.map(student => ({
        class_id: classId,
        student_id: student.id,
        date: classInfo.date,
        status: student.isPresent ? 'present' : 'absent',
        recorded_by: 'system' // Since we removed authentication
      }));
      
      console.log("Inserting attendance records:", records);
      
      const { error } = await supabase
        .from('attendance_records')
        .insert(records);
      
      if (error) {
        console.error("Error inserting attendance records:", error);
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });
      
      // Invalidate queries to force fresh data when navigating back
      queryClient.invalidateQueries({ queryKey: ['studentIds'] });
      queryClient.invalidateQueries({ queryKey: ['studentDetails'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['teacherStudents'] });
      queryClient.invalidateQueries({ queryKey: ['classStudents'] });
      queryClient.invalidateQueries({ queryKey: ['todayAttendance'] });
      
      navigate('/dashboard/teacher');
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "Failed to save attendance: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userRole="teacher" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Take Attendance</h1>
            <p className="text-gray-500">
              {loadingClass ? "Loading class info..." : classInfo.name} &bull; {classInfo.date}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleMarkAllPresent} disabled={loading}>
              Mark All Present
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Student Attendance
            </CardTitle>
            <span className="text-sm text-gray-500">
              {loadingStudentIds || loadingStudentDetails ? (
                "Loading students..."
              ) : (
                `${students.filter((s) => s.isPresent).length} of ${students.length} present`
              )}
            </span>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                {loadingStudentIds || loadingStudentDetails ? (
                  <p className="text-gray-500">Loading students...</p>
                ) : students.length > 0 ? (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`student-${student.id}`}
                          checked={student.isPresent}
                          onCheckedChange={() => handleTogglePresence(student.id)}
                        />
                        <label
                          htmlFor={`student-${student.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {student.name}
                        </label>
                      </div>
                      {student.isPresent ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
                          <Check className="h-3 w-3 mr-1" />
                          Present
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center">
                          <X className="h-3 w-3 mr-1" />
                          Absent
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No students found in this class</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate('/classes-students')}
                    >
                      Manage Students
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TakeAttendance;