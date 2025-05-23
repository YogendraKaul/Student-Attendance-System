import { useState, useEffect } from "react";
import { Calendar, Users, UserCheck, Book, Download } from "lucide-react";
import NavBar from "@/components/NavBar";
import DashboardCard from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/integrations/supabase/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import * as XLSX from 'xlsx';
import { format } from "date-fns";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [studentsWithAttendance, setStudentsWithAttendance] = useState<any[]>([]);
  
  // Fetch classes
  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['teacherClasses'],
    queryFn: async () => {
      console.log("Fetching classes");
      
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error("Failed to load classes:", error);
        toast({
          title: "Error",
          description: "Failed to load classes: " + error.message,
          variant: "destructive"
        });
        return [];
      }
      
      console.log("Classes fetched:", data);
      return data;
    }
  });
  
  // Set first class as selected once loaded
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);
  
  // Fetch students for the selected class
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['classStudents', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      console.log("Fetching students for class ID:", selectedClass);
      
      // First get student IDs in this class
      const { data: classStudents, error: classStudentsError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', selectedClass);
      
      if (classStudentsError) {
        console.error("Error loading class students:", classStudentsError);
        toast({
          title: "Error",
          description: "Failed to load students: " + classStudentsError.message,
          variant: "destructive"
        });
        return [];
      }
      
      console.log("Retrieved class student IDs:", classStudents);
      
      if (!classStudents?.length) return [];
      
      const studentIds = classStudents.map(item => item.student_id);
      
      // Then fetch student details
      const { data: studentDetails, error: studentDetailsError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', studentIds)
        .eq('role', 'student');
      
      if (studentDetailsError) {
        console.error("Error loading student details:", studentDetailsError);
        toast({
          title: "Error",
          description: "Failed to load student details: " + studentDetailsError.message,
          variant: "destructive"
        });
        return [];
      }
      
      console.log("Retrieved student details:", studentDetails);
      
      return studentDetails.map(student => ({
        ...student,
        name: `${student.first_name} ${student.last_name}`
      }));
    },
    enabled: !!selectedClass
  });
  
  // Fetch attendance records for the selected class for today
  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ['todayAttendance', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('date', today);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load attendance records: " + error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data;
    },
    enabled: !!selectedClass
  });
  
  // Calculate statistics for the selected class
  const classStats = {
    totalStudents: students?.length || 0,
    presentStudents: attendanceData?.filter(record => record.status === 'present').length || 0,
    attendanceRate: students?.length 
      ? Math.round(((attendanceData?.filter(record => record.status === 'present').length || 0) / students.length) * 100) + "%" 
      : "0%"
  };

  // Combine students with their attendance status
  useEffect(() => {
    if (students && attendanceData) {
      const today = new Date().toISOString().split('T')[0];
      const studentsWithStatus = students.map(student => {
        const attendance = attendanceData.find(record => 
          record.student_id === student.id && 
          record.date === today
        );
        
        return {
          ...student,
          isPresent: attendance ? attendance.status === 'present' : false,
          attendanceRecorded: !!attendance
        };
      });
      
      setStudentsWithAttendance(studentsWithStatus);
    }
  }, [students, attendanceData]);

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['teacherClasses'] });
    queryClient.invalidateQueries({ queryKey: ['classStudents', selectedClass] });
    queryClient.invalidateQueries({ queryKey: ['todayAttendance', selectedClass] });
    toast({
      title: "Success",
      description: "Data refreshed successfully",
    });
  };

  const toggleAttendance = async (studentId: string, isPresent: boolean) => {
    if (!selectedClass) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Check if attendance record exists for today
      const { data: existingRecord, error: fetchError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('student_id', studentId)
        .eq('date', today);
      
      if (fetchError) throw fetchError;
      
      if (existingRecord && existingRecord.length > 0) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('attendance_records')
          .update({ status: isPresent ? 'present' : 'absent' })
          .eq('id', existingRecord[0].id);
        
        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('attendance_records')
          .insert([
            {
              class_id: selectedClass,
              student_id: studentId,
              date: today,
              status: isPresent ? 'present' : 'absent',
              recorded_by: user?.id || 'system'
            }
          ]);
        
        if (insertError) throw insertError;
      }
      
      // Update local state to show changes immediately
      setStudentsWithAttendance(prev => 
        prev.map(student => 
          student.id === studentId
            ? { ...student, isPresent, attendanceRecorded: true }
            : student
        )
      );
      
      // Show success message
      toast({
        title: "Success",
        description: `Marked ${isPresent ? 'present' : 'absent'}`,
      });
      
      // Refresh attendance data
      queryClient.invalidateQueries({ queryKey: ['todayAttendance', selectedClass] });
    } catch (error: any) {
      console.error("Failed to update attendance:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance: " + error.message,
        variant: "destructive"
      });
    }
  };

  const generateExcelReport = async () => {
    if (!selectedClass || !students?.length) {
      toast({
        title: "Error",
        description: "Please select a class with students to generate report",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get the class name
      const className = classes?.find(c => c.id === selectedClass)?.name || "Unknown Class";
      
      // Fetch all attendance records for this class (not just today)
      const { data: allAttendanceData, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('class_id', selectedClass)
        .order('date', { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch attendance data: " + error.message,
          variant: "destructive"
        });
        return;
      }

      // Get all unique dates
      const allDates = [...new Set(allAttendanceData?.map(record => record.date) || [])].sort();
      
      // Create worksheet data
      const worksheetData = [];
      
      // Add class name at the top
      worksheetData.push([`Class: ${className}`]);
      worksheetData.push([]);  // Empty row for spacing
      
      // Header row with Name and dates
      const headerRow = ['Student Name', 'Status', ...allDates.map(date => format(new Date(date), 'MMM dd, yyyy'))];
      worksheetData.push(headerRow);
      
      // Student rows with attendance data
      students.forEach(student => {
        // Count present and absent days for this student
        const presentDays = allAttendanceData?.filter(
          record => record.student_id === student.id && record.status === 'present'
        ).length || 0;
        
        const totalRecordedDays = allAttendanceData?.filter(
          record => record.student_id === student.id
        ).length || 0;
        
        // Calculate attendance percentage
        const attendanceStatus = totalRecordedDays > 0 
          ? `${Math.round((presentDays / totalRecordedDays) * 100)}% Present` 
          : 'No Records';
        
        const row = [student.name, attendanceStatus];
        
        allDates.forEach(date => {
          const attendanceRecord = allAttendanceData?.find(
            record => record.student_id === student.id && record.date === date
          );
          if (attendanceRecord) {
            row.push(attendanceRecord.status === 'present' ? 'Present' : 'Absent');
          } else {
            row.push('Not Recorded');
          }
        });
        
        worksheetData.push(row);
      });

      // Add summary section
      worksheetData.push([]);
      worksheetData.push(['ATTENDANCE SUMMARY']);
      worksheetData.push(['Total Students', students.length]);
      worksheetData.push([]);
      
      // Add date-wise summary
      allDates.forEach(date => {
        const presentCount = allAttendanceData?.filter(
          record => record.date === date && record.status === 'present'
        ).length || 0;
        
        const absentCount = allAttendanceData?.filter(
          record => record.date === date && record.status === 'absent'
        ).length || 0;
        
        worksheetData.push([
          format(new Date(date), 'MMM dd, yyyy'),
          `Present: ${presentCount}`,
          `Absent: ${absentCount}`,
          `Attendance Rate: ${students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%`
        ]);
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      const maxWidth = worksheetData.reduce((w, r) => Math.max(w, r.length), 0);
      worksheet['!cols'] = Array.from({ length: maxWidth }, () => ({ wch: 15 }));
      
      // Make the headers bold by applying cell styles
      // Define a style for bold text
      const boldStyle = { font: { bold: true } };
      
      // Apply bold style to the class name
      if (worksheet.A1) {
        worksheet.A1.s = boldStyle;
      }
      
      // Apply bold style to all header cells in the header row
      const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A3:Z3");
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 2, c: col });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = boldStyle;
      }
      
      // Apply bold style to the summary title
      const summaryRowIndex = students.length + 4;  // Adjust based on your data
      const summaryTitleAddress = XLSX.utils.encode_cell({ r: summaryRowIndex, c: 0 });
      if (worksheet[summaryTitleAddress]) {
        worksheet[summaryTitleAddress].s = boldStyle;
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
      
      // Generate filename with current date
      const filename = `${className}_Attendance_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      // Download the file
      XLSX.writeFile(workbook, filename);
      
      toast({
        title: "Success",
        description: "Excel report generated successfully",
      });
      
    } catch (error: any) {
      console.error("Failed to generate Excel report:", error);
      toast({
        title: "Error",
        description: "Failed to generate Excel report: " + error.message,
        variant: "destructive"
      });
    }
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
          <div className="space-x-2">
            <Button variant="outline" onClick={refreshData}>
              Refresh Data
            </Button>
            {selectedClass && (
              <Button variant="outline" onClick={generateExcelReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            )}
            <Button onClick={() => navigate('/classes-students')}>
              Manage Classes & Students
            </Button>
          </div>
        </div>
        
        {/* Class Selector */}
        <div className="mb-6">
          <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Class
          </label>
          <Select value={selectedClass || ""} onValueChange={handleClassChange}>
            <SelectTrigger id="class-select" className="w-full sm:w-72">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {loadingClasses ? (
                <SelectItem value="loading">Loading classes...</SelectItem>
              ) : classes && classes.length > 0 ? (
                classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none">No classes available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Class Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <DashboardCard
            title="Total Students"
            value={classStats.totalStudents}
            description={loadingStudents ? "Loading students..." : `${classStats.totalStudents} students in class`}
            icon={<Users className="h-4 w-4" />}
          />
          <DashboardCard
            title="Present Today"
            value={classStats.presentStudents}
            description={`${classStats.attendanceRate} attendance rate`}
            icon={<UserCheck className="h-4 w-4" />}
          />
          <DashboardCard
            title="Class"
            value={classes?.find(c => c.id === selectedClass)?.name || "None"}
            description="Currently selected class"
            icon={<Book className="h-4 w-4" />}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Classes Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Today's Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingClasses ? (
                  <p className="text-gray-500">Loading classes...</p>
                ) : classes && classes.length > 0 ? (
                  classes.map((cls) => {
                    // Determine if attendance has been recorded for this class today
                    const hasAttendanceRecords = attendanceData && attendanceData.length > 0 && 
                      attendanceData.some(record => record.class_id === cls.id);
                    
                    return (
                      <div key={cls.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{cls.name}</p>
                        </div>
                        <div>
                          {hasAttendanceRecords ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                              Attendance Taken
                            </span>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedClass(cls.id)}
                            >
                              Take Attendance
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No classes available</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate('/classes-students')}
                    >
                      Add Classes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Class Students Card with Attendance */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Student Attendance</CardTitle>
              {selectedClass && (
                <div className="flex space-x-2">
                  <ToggleGroup type="single" value={selectedClass} onValueChange={handleClassChange}>
                    {classes?.map((cls) => (
                      <ToggleGroupItem key={cls.id} value={cls.id} aria-label={cls.name} title={cls.name}>
                        {cls.name}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <div className="flex justify-center items-center h-48">
                  <p className="text-gray-500">Loading students...</p>
                </div>
              ) : studentsWithAttendance && studentsWithAttendance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Mark Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsWithAttendance.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell className="text-center">
                          {student.attendanceRecorded ? (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              student.isPresent 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.isPresent ? 'Present' : 'Absent'}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                              Not recorded
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-4">
                            <Button 
                              variant={student.isPresent ? "default" : "outline"} 
                              size="sm"
                              onClick={() => toggleAttendance(student.id, true)}
                              className={student.isPresent ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              Present
                            </Button>
                            <Button 
                              variant={!student.isPresent && student.attendanceRecorded ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleAttendance(student.id, false)}
                              className={!student.isPresent && student.attendanceRecorded ? "bg-red-600 hover:bg-red-700" : ""}
                            >
                              Absent
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No students found in this class</p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/classes-students')}
                  >
                    Add Students
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
