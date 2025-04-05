
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { UserPlus, Plus, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ClassesStudents = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("classes");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isAddingExistingStudent, setIsAddingExistingStudent] = useState(false);

  // Define schemas for form validation
  const classSchema = z.object({
    name: z.string().min(1, { message: "Class name is required" }),
  });

  const newStudentSchema = z.object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
  });

  const existingStudentSchema = z.object({
    studentId: z.string().min(1, { message: "Please select a student" }),
  });

  // Form definitions using react-hook-form
  const classForm = useForm({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
    },
  });

  const newStudentForm = useForm({
    resolver: zodResolver(newStudentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const existingStudentForm = useForm({
    resolver: zodResolver(existingStudentSchema),
    defaultValues: {
      studentId: "",
    },
  });

  // Fetch classes
  const {
    data: classes,
    isLoading: loadingClasses,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .order("name");

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load classes: " + error.message,
          variant: "destructive",
        });
        return [];
      }

      return data || [];
    },
  });

  // Fetch students for the selected class
  const {
    data: classStudents,
    isLoading: loadingClassStudents,
    refetch: refetchClassStudents,
  } = useQuery({
    queryKey: ["classStudents", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];

      // First, get student IDs in this class
      const { data: studentIds, error: studentIdsError } = await supabase
        .from("class_students")
        .select("student_id")
        .eq("class_id", selectedClass);

      if (studentIdsError) {
        toast({
          title: "Error",
          description: "Failed to load student IDs: " + studentIdsError.message,
          variant: "destructive",
        });
        return [];
      }

      if (!studentIds || studentIds.length === 0) return [];

      // Then, get details for these students
      const { data: studentDetails, error: studentDetailsError } =
        await supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .in(
            "id",
            studentIds.map((s) => s.student_id)
          )
          .eq("role", "student");

      if (studentDetailsError) {
        toast({
          title: "Error",
          description:
            "Failed to load student details: " + studentDetailsError.message,
          variant: "destructive",
        });
        return [];
      }

      return studentDetails || [];
    },
    enabled: !!selectedClass,
  });

  // Fetch all students (for adding existing students to class)
  const {
    data: allStudents,
    isLoading: loadingAllStudents,
    refetch: refetchAllStudents,
  } = useQuery({
    queryKey: ["allStudents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .eq("role", "student")
        .order("last_name");

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load students: " + error.message,
          variant: "destructive",
        });
        return [];
      }

      return data || [];
    },
  });

  // Fetch today's attendance records for the selected class
  const { 
    data: attendanceRecords, 
    isLoading: loadingAttendance,
    refetch: refetchAttendance 
  } = useQuery({
    queryKey: ["todayAttendance", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("date", today);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load attendance records: " + error.message,
          variant: "destructive",
        });
        return [];
      }

      return data || [];
    },
    enabled: !!selectedClass,
  });

  // Set first class as selected when classes are loaded
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  // Handle creating a new class
  const handleCreateClass = async (formData: { name: string }) => {
    try {
      // Get the current user ID for teacher_id
      const { data: { session } } = await supabase.auth.getSession();
      const teacherId = session?.user?.id;
      
      if (!teacherId) {
        toast({
          title: "Error",
          description: "You must be logged in to create a class",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase
        .from("classes")
        .insert([{ 
          name: formData.name,
          teacher_id: teacherId
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class created successfully",
      });
      
      classForm.reset();
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      refetchClasses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create class: " + error.message,
        variant: "destructive",
      });
    }
  };

  // Handle removing a class
  const handleRemoveClass = async (classId: string) => {
    if (!confirm("Are you sure you want to remove this class?")) return;

    try {
      // First, remove all students from this class
      const { error: studentRemovalError } = await supabase
        .from("class_students")
        .delete()
        .eq("class_id", classId);

      if (studentRemovalError) throw studentRemovalError;

      // Then, remove the class itself
      const { error: classRemovalError } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);

      if (classRemovalError) throw classRemovalError;

      toast({
        title: "Success",
        description: "Class removed successfully",
      });
      
      setSelectedClass(null);
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      refetchClasses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove class: " + error.message,
        variant: "destructive",
      });
    }
  };

  // Handle adding a new student
  const handleAddNewStudent = async (formData: {
    firstName: string;
    lastName: string;
    email: string;
  }) => {
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Please select a class first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if the student already exists
      const { data: existingUsers, error: existingUsersError } = await supabase
        .from("users")
        .select("id")
        .eq("email", formData.email);

      if (existingUsersError) throw existingUsersError;

      let userId;

      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id;
        
        // Check if the student is already in this class
        const { data: existingClassStudents, error: existingClassStudentsError } = await supabase
          .from("class_students")
          .select("id")
          .eq("class_id", selectedClass)
          .eq("student_id", userId);
        
        if (existingClassStudentsError) throw existingClassStudentsError;
        
        if (existingClassStudents && existingClassStudents.length > 0) {
          toast({
            title: "Info",
            description: "Student already exists in this class.",
          });
          newStudentForm.reset();
          return;
        }
      } else {
        // Generate a UUID for the new user
        const newUserId = crypto.randomUUID();
        
        // Create new user
        const { error: newUserError } = await supabase
          .from("users")
          .insert({
            id: newUserId,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            role: "student"
          });

        if (newUserError) throw newUserError;

        userId = newUserId;
        console.log("Created new user with ID:", userId);
      }

      // Add student to the class
      const { error: addToClassError } = await supabase
        .from("class_students")
        .insert([
          {
            class_id: selectedClass,
            student_id: userId,
          },
        ]);

      if (addToClassError) throw addToClassError;

      toast({
        title: "Success",
        description: "Student added successfully",
      });
      
      newStudentForm.reset();
      queryClient.invalidateQueries({ queryKey: ["classStudents", selectedClass] });
      queryClient.invalidateQueries({ queryKey: ["allStudents"] });
      refetchClassStudents();
      refetchAllStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add student: " + error.message,
        variant: "destructive",
      });
    }
  };

  // Handle adding an existing student to the class
  const handleAddExistingStudent = async (formData: {
    studentId: string;
  }) => {
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Please select a class first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if student is already in this class
      const { data: existingEntry, error: checkError } = await supabase
        .from("class_students")
        .select("id")
        .eq("class_id", selectedClass)
        .eq("student_id", formData.studentId);

      if (checkError) throw checkError;

      if (existingEntry && existingEntry.length > 0) {
        toast({
          title: "Info",
          description: "Student already exists in this class.",
        });
        existingStudentForm.reset();
        return;
      }

      // Add student to class
      const { error: addError } = await supabase
        .from("class_students")
        .insert([
          {
            class_id: selectedClass,
            student_id: formData.studentId,
          },
        ]);

      if (addError) throw addError;

      toast({
        title: "Success",
        description: "Student added to class successfully",
      });
      
      existingStudentForm.reset();
      setIsAddingExistingStudent(false);
      queryClient.invalidateQueries({ queryKey: ["classStudents", selectedClass] });
      refetchClassStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add student to class: " + error.message,
        variant: "destructive",
      });
    }
  };

  // Handle removing a student from a class
  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass || !confirm("Remove this student from the class?")) return;

    try {
      const { error } = await supabase
        .from("class_students")
        .delete()
        .eq("class_id", selectedClass)
        .eq("student_id", studentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student removed from class",
      });
      
      queryClient.invalidateQueries({ queryKey: ["classStudents", selectedClass] });
      refetchClassStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove student: " + error.message,
        variant: "destructive",
      });
    }
  };

  // Toggle attendance for a student
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
              recorded_by: 'system'
            }
          ]);
        
        if (insertError) throw insertError;
      }
      
      // Show success message
      toast({
        title: "Success",
        description: `Marked ${isPresent ? 'present' : 'absent'}`,
      });
      
      // Refresh attendance data
      queryClient.invalidateQueries({ queryKey: ['todayAttendance', selectedClass] });
      refetchAttendance();
    } catch (error: any) {
      console.error("Failed to update attendance:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance: " + error.message,
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
            <h1 className="text-2xl font-bold">Manage Classes & Students</h1>
            <p className="text-gray-500">
              Create classes and add students to them
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard/teacher")}>
            Back to Dashboard
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="classes">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Create a New Class</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...classForm}>
                    <form
                      onSubmit={classForm.handleSubmit(handleCreateClass)}
                      className="space-y-4"
                    >
                      <FormField
                        control={classForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Math 101" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        Create Class
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Your Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingClasses ? (
                    <p className="text-gray-500">Loading classes...</p>
                  ) : classes && classes.length > 0 ? (
                    <div className="space-y-4">
                      {classes.map((cls) => (
                        <div
                          key={cls.id}
                          className={`p-4 border rounded-md ${
                            selectedClass === cls.id
                              ? "border-primary"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{cls.name}</h3>
                            <div className="flex gap-2">
                              <Button
                                variant={
                                  selectedClass === cls.id
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setSelectedClass(cls.id)}
                              >
                                {selectedClass === cls.id
                                  ? "Selected"
                                  : "Select"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveClass(cls.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No classes created yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  Students in{" "}
                  {selectedClass
                    ? classes?.find((c) => c.id === selectedClass)?.name ||
                      "Selected Class"
                    : "Class"}
                </CardTitle>
                {selectedClass && (
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add New Student
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Student</DialogTitle>
                        </DialogHeader>
                        <Form {...newStudentForm}>
                          <form
                            onSubmit={newStudentForm.handleSubmit(
                              handleAddNewStudent
                            )}
                            className="space-y-4 mt-4"
                          >
                            <FormField
                              control={newStudentForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter first name"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={newStudentForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter last name"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={newStudentForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter email address"
                                      type="email"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end gap-2 pt-4">
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button type="submit">Add Student</Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <Dialog
                      open={isAddingExistingStudent}
                      onOpenChange={setIsAddingExistingStudent}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Existing Student
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Existing Student</DialogTitle>
                        </DialogHeader>
                        <Form {...existingStudentForm}>
                          <form
                            onSubmit={existingStudentForm.handleSubmit(
                              handleAddExistingStudent
                            )}
                            className="space-y-4 mt-4"
                          >
                            <FormField
                              control={existingStudentForm.control}
                              name="studentId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Select Student</FormLabel>
                                  <FormControl>
                                    <Select
                                      value={field.value}
                                      onValueChange={field.onChange}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a student" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {loadingAllStudents ? (
                                          <SelectItem value="loading" disabled>
                                            Loading students...
                                          </SelectItem>
                                        ) : allStudents &&
                                          allStudents.length > 0 ? (
                                          allStudents.map((student) => (
                                            <SelectItem
                                              key={student.id}
                                              value={student.id}
                                            >
                                              {student.first_name}{" "}
                                              {student.last_name} ({student.email})
                                            </SelectItem>
                                          ))
                                        ) : (
                                          <SelectItem value="none" disabled>
                                            No students available
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end gap-2 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setIsAddingExistingStudent(false)
                                }
                              >
                                Cancel
                              </Button>
                              <Button type="submit">Add to Class</Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!selectedClass ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">
                      Please select a class first to manage students
                    </p>
                  </div>
                ) : loadingClassStudents ? (
                  <p className="text-gray-500">Loading students...</p>
                ) : classStudents && classStudents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Attendance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classStudents.map((student) => {
                        // Find attendance record for this student today
                        const today = new Date().toISOString().split('T')[0];
                        const attendanceRecord = attendanceRecords?.find(
                          record => record.student_id === student.id && record.date === today
                        );
                        const isPresent = attendanceRecord?.status === 'present';
                        const hasAttendance = !!attendanceRecord;
                        
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.first_name} {student.last_name}
                            </TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-2">
                                <Button 
                                  variant={isPresent ? "default" : "outline"} 
                                  size="sm"
                                  onClick={() => toggleAttendance(student.id, true)}
                                  className={isPresent ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Present
                                </Button>
                                <Button 
                                  variant={!isPresent && hasAttendance ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleAttendance(student.id, false)}
                                  className={!isPresent && hasAttendance ? "bg-red-600 hover:bg-red-700" : ""}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Absent
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveStudent(student.id)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">
                      No students in this class yet
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>Add New Student</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Student</DialogTitle>
                          </DialogHeader>
                          <Form {...newStudentForm}>
                            <form
                              onSubmit={newStudentForm.handleSubmit(
                                handleAddNewStudent
                              )}
                              className="space-y-4 mt-4"
                            >
                              <FormField
                                control={newStudentForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter first name"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={newStudentForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter last name"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={newStudentForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter email address"
                                        type="email"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex justify-end gap-2 pt-4">
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Add Student</Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClassesStudents;