
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Calendar, Check } from "lucide-react";

interface Student {
  id: string;
  name: string;
  isPresent: boolean;
}

const TakeAttendance = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  
  // In a real app, this would come from an API based on the classId
  const [classInfo] = useState({
    id: classId || "10A",
    name: classId ? `Class ${classId}` : "Class 10A",
    date: new Date().toISOString().split('T')[0],
  });
  
  const [students, setStudents] = useState<Student[]>([
    { id: "1", name: "John Smith", isPresent: true },
    { id: "2", name: "Mary Johnson", isPresent: true },
    { id: "3", name: "Robert Williams", isPresent: true },
    { id: "4", name: "Patricia Brown", isPresent: true },
    { id: "5", name: "Michael Jones", isPresent: true },
    { id: "6", name: "Linda Davis", isPresent: true },
    { id: "7", name: "James Miller", isPresent: true },
    { id: "8", name: "Jennifer Wilson", isPresent: true },
    { id: "9", name: "David Moore", isPresent: true },
    { id: "10", name: "Elizabeth Taylor", isPresent: true },
  ]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the data to an API
    toast.success("Attendance saved successfully");
    navigate('/dashboard/teacher');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userRole="teacher" />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Take Attendance</h1>
            <p className="text-gray-500">
              {classInfo.name} &bull; {classInfo.date}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleMarkAllPresent}>
              Mark All Present
            </Button>
            <Button onClick={handleSubmit}>Save Attendance</Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Student Attendance
            </CardTitle>
            <span className="text-sm text-gray-500">
              {students.filter((s) => s.isPresent).length} of {students.length} present
            </span>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                {students.map((student) => (
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
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Absent
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TakeAttendance;
