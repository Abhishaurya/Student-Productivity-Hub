import { db } from "./index";
import {
  coursesTable,
  timetableSlotsTable,
  tasksTable,
  attendanceRecordsTable,
  notesTable,
  gradeEntriesTable,
  goalsTable,
  remindersTable,
} from "./schema";

const DEMO_USER_ID = "seed-demo-user";

async function seed() {
  console.log("Seeding Student OS demo data...");

  const [dsa, calc, physics, lit] = await db
    .insert(coursesTable)
    .values([
      { userId: DEMO_USER_ID, name: "Data Structures & Algorithms", code: "CS201", instructor: "Dr. Rao", color: "#f59e0b", credits: 4 },
      { userId: DEMO_USER_ID, name: "Calculus II", code: "MATH152", instructor: "Prof. Nguyen", color: "#22c55e", credits: 3 },
      { userId: DEMO_USER_ID, name: "Physics: Electromagnetism", code: "PHYS210", instructor: "Dr. Alvarez", color: "#38bdf8", credits: 4 },
      { userId: DEMO_USER_ID, name: "World Literature", code: "LIT110", instructor: "Prof. Diaz", color: "#a855f7", credits: 2 },
    ])
    .returning();

  await db.insert(timetableSlotsTable).values([
    { userId: DEMO_USER_ID, courseId: dsa.id, dayOfWeek: 1, startTime: "09:00", endTime: "10:15", location: "Hall A-201" },
    { userId: DEMO_USER_ID, courseId: dsa.id, dayOfWeek: 3, startTime: "09:00", endTime: "10:15", location: "Hall A-201" },
    { userId: DEMO_USER_ID, courseId: calc.id, dayOfWeek: 1, startTime: "11:00", endTime: "12:00", location: "Room 108" },
    { userId: DEMO_USER_ID, courseId: calc.id, dayOfWeek: 4, startTime: "11:00", endTime: "12:00", location: "Room 108" },
    { userId: DEMO_USER_ID, courseId: physics.id, dayOfWeek: 2, startTime: "13:30", endTime: "15:00", location: "Lab C-3" },
    { userId: DEMO_USER_ID, courseId: lit.id, dayOfWeek: 5, startTime: "10:00", endTime: "11:15", location: "Room 220" },
  ]);

  const now = Date.now();
  const daysFromNow = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000);

  await db.insert(tasksTable).values([
    { userId: DEMO_USER_ID, title: "DSA Problem Set 4", courseId: dsa.id, type: "assignment", dueDate: daysFromNow(2), status: "pending", priority: "high", description: "Graphs and shortest paths." },
    { userId: DEMO_USER_ID, title: "Calculus Midterm", courseId: calc.id, type: "exam", dueDate: daysFromNow(5), status: "pending", priority: "high" },
    { userId: DEMO_USER_ID, title: "Physics Lab Report 3", courseId: physics.id, type: "assignment", dueDate: daysFromNow(3), status: "in_progress", priority: "medium" },
    { userId: DEMO_USER_ID, title: "Literature Essay Draft", courseId: lit.id, type: "assignment", dueDate: daysFromNow(7), status: "pending", priority: "low" },
    { userId: DEMO_USER_ID, title: "DSA Quiz 2", courseId: dsa.id, type: "exam", dueDate: daysFromNow(-2), status: "completed", priority: "medium", grade: "A-" },
  ]);

  const dateStr = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await db.insert(attendanceRecordsTable).values([
    { userId: DEMO_USER_ID, courseId: dsa.id, date: dateStr(-7), status: "present" },
    { userId: DEMO_USER_ID, courseId: dsa.id, date: dateStr(-5), status: "present" },
    { userId: DEMO_USER_ID, courseId: dsa.id, date: dateStr(-3), status: "absent" },
    { userId: DEMO_USER_ID, courseId: dsa.id, date: dateStr(-1), status: "present" },
    { userId: DEMO_USER_ID, courseId: calc.id, date: dateStr(-7), status: "present" },
    { userId: DEMO_USER_ID, courseId: calc.id, date: dateStr(-4), status: "absent" },
    { userId: DEMO_USER_ID, courseId: calc.id, date: dateStr(-2), status: "absent" },
    { userId: DEMO_USER_ID, courseId: physics.id, date: dateStr(-6), status: "present" },
    { userId: DEMO_USER_ID, courseId: physics.id, date: dateStr(-3), status: "excused" },
    { userId: DEMO_USER_ID, courseId: lit.id, date: dateStr(-5), status: "present" },
  ]);

  await db.insert(notesTable).values([
    { userId: DEMO_USER_ID, title: "Graph Traversal Basics", content: "BFS uses a queue and explores neighbors level by level. DFS uses a stack (or recursion) and goes deep before backtracking. Both are O(V+E) for adjacency lists.", courseId: dsa.id, tags: ["graphs", "midterm"] },
    { userId: DEMO_USER_ID, title: "Integration by Parts", content: "Formula: integral of u dv = uv - integral of v du. Choose u using LIATE ordering: Logs, Inverse trig, Algebraic, Trig, Exponential.", courseId: calc.id, tags: ["calculus"] },
  ]);

  await db.insert(gradeEntriesTable).values([
    { userId: DEMO_USER_ID, semesterName: "Fall 2025", courseName: "Intro to Programming", credits: 4, gradePoint: 9.0 },
    { userId: DEMO_USER_ID, semesterName: "Fall 2025", courseName: "Linear Algebra", credits: 3, gradePoint: 8.3 },
    { userId: DEMO_USER_ID, semesterName: "Fall 2025", courseName: "English Composition", credits: 2, gradePoint: 8.8 },
    { userId: DEMO_USER_ID, semesterName: "Spring 2026", courseName: "Data Structures", credits: 4, gradePoint: 8.7 },
    { userId: DEMO_USER_ID, semesterName: "Spring 2026", courseName: "Physics I", credits: 4, gradePoint: 7.9 },
  ]);

  await db.insert(goalsTable).values([
    { userId: DEMO_USER_ID, targetCgpa: 9.0, targetDate: "2027-05-15", note: "Aiming for the dean's list before graduation." },
  ]);

  await db.insert(remindersTable).values([
    { userId: DEMO_USER_ID, title: "Register for next semester courses", remindAt: daysFromNow(4), description: "Registration portal opens at 9am." },
    { userId: DEMO_USER_ID, title: "Pay tuition installment", remindAt: daysFromNow(6) },
    { userId: DEMO_USER_ID, title: "Return library books", remindAt: daysFromNow(1) },
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
