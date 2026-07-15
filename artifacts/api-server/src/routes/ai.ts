import { Router, type IRouter } from "express";
import { and, asc, eq, ne } from "drizzle-orm";
import { db, tasksTable, notesTable } from "@workspace/db";
import { openai } from "../lib/openai";
import {
  GenerateStudyPlanResponse,
  SummarizeNoteParams,
  SummarizeNoteResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.post("/ai/study-plan", async (req, res): Promise<void> => {
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(and(ne(tasksTable.status, "completed"), eq(tasksTable.userId, req.userId!)))
    .orderBy(asc(tasksTable.dueDate));

  if (tasks.length === 0) {
    res.json(
      GenerateStudyPlanResponse.parse({
        plan: "You have no pending assignments or exams right now. Enjoy the breathing room, or get ahead by reviewing your notes.",
        generatedAt: new Date().toISOString(),
      }),
    );
    return;
  }

  const taskList = tasks
    .map(
      (t) =>
        `- [${t.type}] "${t.title}" due ${new Date(t.dueDate).toDateString()} (priority: ${t.priority}, status: ${t.status})`,
    )
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a supportive academic study planner for a college student. Given a list of pending assignments and exams, produce a concise, encouraging, actionable study plan in markdown. Prioritize by due date and priority, suggest a realistic day-by-day breakdown for the next 7 days, and keep it focused and practical rather than generic.",
        },
        {
          role: "user",
          content: `Here are my pending tasks:\n${taskList}\n\nGenerate my study plan.`,
        },
      ],
    });

    const plan =
      completion.choices[0]?.message?.content?.trim() ??
      "Could not generate a plan right now. Please try again.";

    res.json(
      GenerateStudyPlanResponse.parse({
        plan,
        generatedAt: new Date().toISOString(),
      }),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to generate AI study plan");
    res.status(502).json({
      error:
        "The AI study planner is temporarily unavailable. Please check the OpenAI API key/billing and try again.",
    });
  }
});

router.post("/notes/:id/summarize", async (req, res): Promise<void> => {
  const params = SummarizeNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, params.data.id), eq(notesTable.userId, req.userId!)));

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  if (!note.content.trim()) {
    res.status(400).json({ error: "Note has no content to summarize" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You summarize a student's class notes into a short, clear summary (3-6 sentences or a tight bullet list) capturing the key concepts. Do not add information that isn't in the notes.",
        },
        {
          role: "user",
          content: `Title: ${note.title}\n\nNotes:\n${note.content}`,
        },
      ],
    });

    const summary =
      completion.choices[0]?.message?.content?.trim() ??
      "Could not generate a summary right now.";

    const [updated] = await db
      .update(notesTable)
      .set({ summary })
      .where(and(eq(notesTable.id, note.id), eq(notesTable.userId, req.userId!)))
      .returning();

    res.json(SummarizeNoteResponse.parse(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to summarize note");
    res.status(502).json({
      error:
        "The AI summarizer is temporarily unavailable. Please check the OpenAI API key/billing and try again.",
    });
  }
});

export default router;
