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

async function seed() {
  console.log("Seeding Student OS demo data...");

  const [dsa, calc, physics, lit] = await db
    .insert(coursesTable)
    .values([
      { name: "Data Structures & Algorithms", code: "CS201", instructor: "Dr. Rao", color: "#f59e0b", credits: 4 },
      { name: "Calculus II", code: "MATH152", instructor: "Prof. Nguyen", color: "#22c55e", credits: 3 },
      { name: "Physics: Electromagnetism", code: "PHYS210", instructor: "Dr. Alvarez", color: "#38bdf8", credits: 4 },
      { name: "World Literature", code: "LIT110", instructor: "Prof. Diaz", color: "#a855f7", credits: 2 },
    ])
    .returning();

  await db.insert(timetableSlotsTable).values([
    { courseId: dsa.id, dayOfWeek: 1, startTime: "09:00", endTime: "10:15", location: "Hall A-201" },
    { courseId: dsa.id, dayOfWeek: 3, startTime: "09:00", endTime: "10:15", location: "Hall A-201" },
    { courseId: calc.id, dayOfWeek: 1, startTime: "11:00", endTime: "12:00", location: "Room 108" },
    { courseId: calc.id, dayOfWeek: 4, startTime: "11:00", endTime: "12:00", location: "Room 108" },
    { courseId: physics.id, dayOfWeek: 2, startTime: "13:30", endTime: "15:00", location: "Lab C-3" },
    { courseId: lit.id, dayOfWeek: 5, startTime: "10:00", endTime: "11:15", location: "Room 220" },
  ]);

  const now = Date.now();
  const daysFromNow = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000);

  await db.insert(tasksTable).values([
    { title: "DSA Problem Set 4", courseId: dsa.id, type: "assignment", dueDate: daysFromNow(2), status: "pending", priority: "high", description: "Graphs and shortest paths." },
    { title: "Calculus Midterm", courseId: calc.id, type: "exam", dueDate: daysFromNow(5), status: "pending", priority: "high" },
    { title: "Physics Lab Report 3", courseId: physics.id, type: "assignment", dueDate: daysFromNow(3), status: "in_progress", priority: "medium" },
    { title: "Literature Essay Draft", courseId: lit.id, type: "assignment", dueDate: daysFromNow(7), status: "pending", priority: "low" },
    { title: "DSA Quiz 2", courseId: dsa.id, type: "exam", dueDate: daysFromNow(-2), status: "completed", priority: "medium", grade: "A-" },
  ]);

  const dateStr = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await db.insert(attendanceRecordsTable).values([
    { courseId: dsa.id, date: dateStr(-7), status: "present" },
    { courseId: dsa.id, date: dateStr(-5), status: "present" },
    { courseId: dsa.id, date: dateStr(-3), status: "absent" },
    { courseId: dsa.id, date: dateStr(-1), status: "present" },
    { courseId: calc.id, date: dateStr(-7), status: "present" },
    { courseId: calc.id, date: dateStr(-4), status: "absent" },
    { courseId: calc.id, date: dateStr(-2), status: "absent" },
    { courseId: physics.id, date: dateStr(-6), status: "present" },
    { courseId: physics.id, date: dateStr(-3), status: "excused" },
    { courseId: lit.id, date: dateStr(-5), status: "present" },
  ]);

  await db.insert(notesTable).values([
    { title: "Graph Traversal Basics", content: "BFS uses a queue and explores neighbors level by level. DFS uses a stack (or recursion) and goes deep before backtracking. Both are O(V+E) for adjacency lists.", courseId: dsa.id, tags: ["graphs", "midterm"] },
    { title: "Integration by Parts", content: "Formula: integral of u dv = uv - integral of v du. Choose u using LIATE ordering: Logs, Inverse trig, Algebraic, Trig, Exponential.", courseId: calc.id, tags: ["calculus"] },
  ]);

  await db.insert(gradeEntriesTable).values([
    { semesterName: "Fall 2025", courseName: "Intro to Programming", credits: 4, gradePoint: 9.0 },
    { semesterName: "Fall 2025", courseName: "Linear Algebra", credits: 3, gradePoint: 8.3 },
    { semesterName: "Fall 2025", courseName: "English Composition", credits: 2, gradePoint: 8.8 },
    { semesterName: "Spring 2026", courseName: "Data Structures", credits: 4, gradePoint: 8.7 },
    { semesterName: "Spring 2026", courseName: "Physics I", credits: 4, gradePoint: 7.9 },
  ]);

  await db.insert(goalsTable).values([
    { targetCgpa: 9.0, targetDate: "2027-05-15", note: "Aiming for the dean's list before graduation." },
  ]);

  await db.insert(remindersTable).values([
    { title: "Register for next semester courses", remindAt: daysFromNow(4), description: "Registration portal opens at 9am." },
    { title: "Pay tuition installment", remindAt: daysFromNow(6) },
    { title: "Return library books", remindAt: daysFromNow(1) },
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
