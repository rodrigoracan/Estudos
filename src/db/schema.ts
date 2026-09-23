import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// Define the 'users' table linking Firebase Auth UID to PostgreSQL
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('Liderança Executiva em TI'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User study topic progress and notes
export const userTopicProgress = pgTable('user_topic_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  topicId: text('topic_id').notNull(),
  progress: integer('progress').default(0).notNull(),
  studyMinutes: integer('study_minutes').default(0).notNull(),
  notes: text('notes').default(''),
  deliverableCompleted: boolean('deliverable_completed').default(false),
  deliverableUrl: text('deliverable_url'),
  lastStudied: text('last_studied'),
  nextReviewDate: text('next_review_date'),
  techniquesCompleted: text('techniques_completed').default('[]'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Study focus sessions (Pomodoro logs)
export const studySessions = pgTable('study_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  topicId: text('topic_id').notNull(),
  trackId: text('track_id').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  techniqueUsed: text('technique_used').default('Pomodoro'),
  date: text('date').notNull(), // YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow(),
});

// Google Workspace integration sync record
export const workspaceSync = pgTable('workspace_sync', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  driveFolderId: text('drive_folder_id'),
  calendarEventsCount: integer('calendar_events_count').default(0),
  tasksSyncedCount: integer('tasks_synced_count').default(0),
  lastSyncedAt: timestamp('last_synced_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userTopicProgress),
  sessions: many(studySessions),
  workspace: many(workspaceSync),
}));

export const userTopicProgressRelations = relations(userTopicProgress, ({ one }) => ({
  user: one(users, {
    fields: [userTopicProgress.userId],
    references: [users.id],
  }),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, {
    fields: [studySessions.userId],
    references: [users.id],
  }),
}));

export const workspaceSyncRelations = relations(workspaceSync, ({ one }) => ({
  user: one(users, {
    fields: [workspaceSync.userId],
    references: [users.id],
  }),
}));
