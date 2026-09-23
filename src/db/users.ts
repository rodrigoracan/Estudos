import { db } from './index.ts';
import { users, userTopicProgress, studySessions, workspaceSync } from './schema.ts';
import { eq, and } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database user getOrCreate failed:", error);
    throw new Error("Failed to synchronize user profile", { cause: error });
  }
}

export async function getUserTopicProgress(userId: number) {
  try {
    return await db.select().from(userTopicProgress).where(eq(userTopicProgress.userId, userId));
  } catch (error) {
    console.error("Failed to query topic progress:", error);
    throw new Error("Failed to load topic progress", { cause: error });
  }
}

export async function upsertTopicProgress(
  userId: number,
  topicId: string,
  data: {
    progress?: number;
    studyMinutes?: number;
    notes?: string;
    deliverableCompleted?: boolean;
    deliverableUrl?: string;
    lastStudied?: string;
    nextReviewDate?: string;
    techniquesCompleted?: string;
  }
) {
  try {
    const existing = await db
      .select()
      .from(userTopicProgress)
      .where(and(eq(userTopicProgress.userId, userId), eq(userTopicProgress.topicId, topicId)));

    if (existing.length > 0) {
      const updated = await db
        .update(userTopicProgress)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(userTopicProgress.id, existing[0].id))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(userTopicProgress)
        .values({
          userId,
          topicId,
          progress: data.progress ?? 0,
          studyMinutes: data.studyMinutes ?? 0,
          notes: data.notes ?? '',
          deliverableCompleted: data.deliverableCompleted ?? false,
          deliverableUrl: data.deliverableUrl,
          lastStudied: data.lastStudied,
          nextReviewDate: data.nextReviewDate,
          techniquesCompleted: data.techniquesCompleted ?? '[]',
        })
        .returning();
      return inserted[0];
    }
  } catch (error) {
    console.error("Failed to upsert topic progress:", error);
    throw new Error("Failed to save progress", { cause: error });
  }
}

export async function addStudySession(
  userId: number,
  topicId: string,
  trackId: string,
  durationMinutes: number,
  techniqueUsed: string = 'Pomodoro',
  date: string = new Date().toISOString().split('T')[0]
) {
  try {
    const session = await db.insert(studySessions).values({
      userId,
      topicId,
      trackId,
      durationMinutes,
      techniqueUsed,
      date,
    }).returning();
    return session[0];
  } catch (error) {
    console.error("Failed to record study session:", error);
    throw new Error("Failed to log study session", { cause: error });
  }
}

export async function getUserSessions(userId: number) {
  try {
    return await db.select().from(studySessions).where(eq(studySessions.userId, userId));
  } catch (error) {
    console.error("Failed to load study sessions:", error);
    throw new Error("Failed to load study sessions", { cause: error });
  }
}

export async function getWorkspaceSyncStatus(userId: number) {
  try {
    const records = await db.select().from(workspaceSync).where(eq(workspaceSync.userId, userId));
    return records[0] || null;
  } catch (error) {
    console.error("Failed to query workspace sync:", error);
    return null;
  }
}

export async function recordWorkspaceSync(
  userId: number,
  data: { driveFolderId?: string; calendarEventsCount?: number; tasksSyncedCount?: number }
) {
  try {
    const existing = await getWorkspaceSyncStatus(userId);
    if (existing) {
      const updated = await db
        .update(workspaceSync)
        .set({
          ...data,
          lastSyncedAt: new Date(),
        })
        .where(eq(workspaceSync.id, existing.id))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(workspaceSync)
        .values({
          userId,
          driveFolderId: data.driveFolderId,
          calendarEventsCount: data.calendarEventsCount ?? 0,
          tasksSyncedCount: data.tasksSyncedCount ?? 0,
        })
        .returning();
      return inserted[0];
    }
  } catch (error) {
    console.error("Failed to update workspace sync record:", error);
    throw new Error("Failed to record workspace sync", { cause: error });
  }
}
