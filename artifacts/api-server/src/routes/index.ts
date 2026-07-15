import { Router, type IRouter } from "express";
import healthRouter from "./health";
import coursesRouter from "./courses";
import timetableSlotsRouter from "./timetableSlots";
import tasksRouter from "./tasks";
import attendanceRecordsRouter from "./attendanceRecords";
import notesRouter from "./notes";
import gradeEntriesRouter from "./gradeEntries";
import goalRouter from "./goal";
import remindersRouter from "./reminders";
import pomodoroSessionsRouter from "./pomodoroSessions";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";
import blocklistItemsRouter from "./blocklistItems";
import focusShieldRouter from "./focusShield";

const router: IRouter = Router();

router.use(healthRouter);
router.use(coursesRouter);
router.use(timetableSlotsRouter);
router.use(tasksRouter);
router.use(attendanceRecordsRouter);
router.use(notesRouter);
router.use(gradeEntriesRouter);
router.use(goalRouter);
router.use(remindersRouter);
router.use(pomodoroSessionsRouter);
router.use(dashboardRouter);
router.use(aiRouter);
router.use(blocklistItemsRouter);
router.use(focusShieldRouter);

export default router;
