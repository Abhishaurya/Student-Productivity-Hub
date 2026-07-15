import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, blocklistItemsTable } from "@workspace/db";
import {
  CreateBlocklistItemBody,
  DeleteBlocklistItemParams,
  ListBlocklistItemsResponse,
  CreateBlocklistItemResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/blocklist-items", async (req, res): Promise<void> => {
  const items = await db
    .select()
    .from(blocklistItemsTable)
    .where(eq(blocklistItemsTable.userId, req.userId!))
    .orderBy(asc(blocklistItemsTable.createdAt));
  res.json(ListBlocklistItemsResponse.parse(items));
});

router.post("/blocklist-items", async (req, res): Promise<void> => {
  const parsed = CreateBlocklistItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .insert(blocklistItemsTable)
    .values({ ...parsed.data, userId: req.userId! })
    .returning();

  res.status(201).json(CreateBlocklistItemResponse.parse(item));
});

router.delete("/blocklist-items/:id", async (req, res): Promise<void> => {
  const params = DeleteBlocklistItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db
    .delete(blocklistItemsTable)
    .where(
      and(
        eq(blocklistItemsTable.id, params.data.id),
        eq(blocklistItemsTable.userId, req.userId!),
      ),
    )
    .returning();

  if (!item) {
    res.status(404).json({ error: "Blocklist item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
