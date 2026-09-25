// Offline demo database used when Supabase env vars are missing.
// Seed data is persisted to localStorage so demo edits survive refresh.

export interface DemoUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface DemoClass {
  id: string;
  name: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export interface DemoClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  created_at: string;
}

export interface DemoAttendance {
  id: string;
  class_id: string;
  student_id: string;
  date: string;
  status: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DemoDb {
  users: DemoUser[];
  classes: DemoClass[];
  class_students: DemoClassStudent[];
  attendance_records: DemoAttendance[];
}

export interface DemoSession {
  access_token: string;
  user: {
    id: string;
    email: string;
    user_metadata: Record<string, string>;
  };
}

const DB_KEY = "demo_db_v1";
const SESSION_KEY = "demo_session_v1";

export const DEMO_CREDENTIALS = [
  { role: "principal", label: "Principal", email: "principal@demo.local", password: "demo" },
  { role: "teacher", label: "Teacher", email: "teacher@demo.local", password: "demo" },
  { role: "student", label: "Student", email: "student@demo.local", password: "demo" },
] as const;

const now = () => new Date().toISOString();
const dayIso = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

// Deterministic pseudo-random so re-seeds produce the same demo data.
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

function seedDb(): DemoDb {
  const ts = now();
  const users: DemoUser[] = [
    { id: "demo-principal-1", email: "principal@demo.local", first_name: "Rajesh", last_name: "Sharma", role: "principal", password: "demo", created_at: ts, updated_at: ts },
    { id: "demo-teacher-1", email: "teacher@demo.local", first_name: "Priya", last_name: "Verma", role: "teacher", password: "demo", created_at: ts, updated_at: ts },
    { id: "demo-teacher-2", email: "karan@demo.local", first_name: "Karan", last_name: "Mehta", role: "teacher", password: "demo", created_at: ts, updated_at: ts },
  ];

  const studentNames: Array<[string, string, string]> = [
    ["demo-student-1", "Aarav", "Patel", "student@demo.local"],
    ["demo-student-2", "Diya", "Shah", "diya@demo.local"],
    ["demo-student-3", "Rohan", "Gupta", "rohan@demo.local"],
    ["demo-student-4", "Sneha", "Reddy", "sneha@demo.local"],
    ["demo-student-5", "Arjun", "Nair", "arjun@demo.local"],
    ["demo-student-6", "Ishita", "Joshi", "ishita@demo.local"],
    ["demo-student-7", "Kabir", "Singh", "kabir@demo.local"],
    ["demo-student-8", "Meera", "Iyer", "meera@demo.local"],
    ["demo-student-9", "Vikram", "Rao", "vikram@demo.local"],
    ["demo-student-10", "Ananya", "Das", "ananya@demo.local"],
    ["demo-student-11", "Aditya", "Kumar", "aditya@demo.local"],
    ["demo-student-12", "Pooja", "Menon", "pooja@demo.local"],
  ];
  for (const [id, first_name, last_name, email] of studentNames) {
    users.push({ id, email, first_name, last_name, role: "student", password: "demo", created_at: ts, updated_at: ts });
  }

  const classes: DemoClass[] = [
    { id: "demo-class-1", name: "BCA Semester 4 - Division A", teacher_id: "demo-teacher-1", created_at: ts, updated_at: ts },
    { id: "demo-class-2", name: "BCA Semester 4 - Division B", teacher_id: "demo-teacher-1", created_at: ts, updated_at: ts },
    { id: "demo-class-3", name: "B.Sc IT Semester 2", teacher_id: "demo-teacher-2", created_at: ts, updated_at: ts },
  ];

  const enrollments: Array<[string, string[]]> = [
    ["demo-class-1", ["demo-student-1", "demo-student-2", "demo-student-3", "demo-student-4", "demo-student-5", "demo-student-6"]],
    ["demo-class-2", ["demo-student-5", "demo-student-6", "demo-student-7", "demo-student-8", "demo-student-9", "demo-student-10"]],
    ["demo-class-3", ["demo-student-9", "demo-student-10", "demo-student-11", "demo-student-12"]],
  ];

  const class_students: DemoClassStudent[] = [];
  const attendance_records: DemoAttendance[] = [];
  let n = 1;

  for (const [class_id, studentIds] of enrollments) {
    const teacher = classes.find((c) => c.id === class_id)?.teacher_id ?? "demo-teacher-1";
    for (const student_id of studentIds) {
      class_students.push({ id: `demo-cs-${n++}`, class_id, student_id, created_at: ts });
      // 14 days of history (including today) so dashboards show real-looking data.
      for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
        const date = dayIso(daysAgo);
        const status = hash(`${student_id}${date}`) % 100 < 85 ? "present" : "absent";
        attendance_records.push({
          id: `demo-ar-${n++}`,
          class_id,
          student_id,
          date,
          status,
          recorded_by: teacher,
          created_at: ts,
          updated_at: ts,
        });
      }
    }
  }

  return { users, classes, class_students, attendance_records };
}

export function loadDemoDb(): DemoDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDb;
      if (parsed.users && parsed.classes && parsed.attendance_records) return parsed;
    }
  } catch {
    // fall through to re-seed
  }
  const db = seedDb();
  saveDemoDb(db);
  return db;
}

export function saveDemoDb(db: DemoDb) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // storage full or unavailable — demo still works in-memory for the session
  }
}

export function resetDemoDb() {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getDemoSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as DemoSession) : null;
  } catch {
    return null;
  }
}

export function setDemoSession(session: DemoSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearDemoSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function newDemoId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
