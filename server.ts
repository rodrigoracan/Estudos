import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { 
  getOrCreateUser, 
  getUserTopicProgress, 
  upsertTopicProgress, 
  addStudySession, 
  getUserSessions,
  getWorkspaceSyncStatus,
  recordWorkspaceSync
} from './src/db/users.ts';
import { generateChatResponse } from './src/lib/gemini.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Public health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Sync or register user in Cloud SQL
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || `${uid}@workspace.app`;
    const name = (req.body && req.body.name) || req.user?.name || email.split('@')[0];

    if (!uid) {
      return res.status(400).json({ error: 'Missing UID in authenticated token' });
    }

    const dbUser = await getOrCreateUser(uid, email, name);
    res.json({ success: true, user: dbUser });
  } catch (error: any) {
    console.error('Failed to sync user with Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Fetch all topic progress for the authenticated user
app.get('/api/topics/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || `${uid}@workspace.app`;
    const dbUser = await getOrCreateUser(uid!, email);

    const progressRecords = await getUserTopicProgress(dbUser.id);
    res.json({ success: true, data: progressRecords });
  } catch (error: any) {
    console.error('Failed to fetch topic progress from Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch progress' });
  }
});

// Upsert topic progress & notes in Cloud SQL
app.post('/api/topics/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || `${uid}@workspace.app`;
    const dbUser = await getOrCreateUser(uid!, email);

    const { 
      topicId, 
      progress, 
      studyMinutes, 
      notes, 
      deliverableCompleted, 
      deliverableUrl, 
      lastStudied, 
      nextReviewDate,
      techniquesCompleted 
    } = req.body;

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    const saved = await upsertTopicProgress(dbUser.id, topicId, {
      progress,
      studyMinutes,
      notes,
      deliverableCompleted,
      deliverableUrl,
      lastStudied,
      nextReviewDate,
      techniquesCompleted: typeof techniquesCompleted === 'string' ? techniquesCompleted : JSON.stringify(techniquesCompleted || []),
    });

    res.json({ success: true, data: saved });
  } catch (error: any) {
    console.error('Failed to save topic progress to Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to save progress' });
  }
});

// Record a completed study session in Cloud SQL
app.post('/api/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || `${uid}@workspace.app`;
    const dbUser = await getOrCreateUser(uid!, email);

    const { topicId, trackId, durationMinutes, techniqueUsed, date } = req.body;
    if (!topicId || !durationMinutes) {
      return res.status(400).json({ error: 'topicId and durationMinutes are required' });
    }

    const session = await addStudySession(
      dbUser.id,
      topicId,
      trackId || 'data',
      durationMinutes,
      techniqueUsed || 'Pomodoro',
      date || new Date().toISOString().split('T')[0]
    );

    res.json({ success: true, data: session });
  } catch (error: any) {
    console.error('Failed to log study session to Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to log study session' });
  }
});

// Fetch study sessions for authenticated user
app.get('/api/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || `${uid}@workspace.app`;
    const dbUser = await getOrCreateUser(uid!, email);

    const sessions = await getUserSessions(dbUser.id);
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    console.error('Failed to get sessions from Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch sessions' });
  }
});

// Workspace sync status
app.get('/api/workspace/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || `${uid}@workspace.app`;
    const dbUser = await getOrCreateUser(uid!, email);

    const syncInfo = await getWorkspaceSyncStatus(dbUser.id);
    res.json({ success: true, data: syncInfo });
  } catch (error: any) {
    console.error('Failed to load workspace sync info:', error);
    res.status(500).json({ error: error.message || 'Failed to load workspace sync' });
  }
});

app.post('/api/workspace/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || `${uid}@workspace.app`;
    const dbUser = await getOrCreateUser(uid!, email);

    const { driveFolderId, calendarEventsCount, tasksSyncedCount } = req.body;
    const record = await recordWorkspaceSync(dbUser.id, {
      driveFolderId,
      calendarEventsCount,
      tasksSyncedCount,
    });

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Failed to update workspace sync in Cloud SQL:', error);
    res.status(500).json({ error: error.message || 'Failed to update workspace sync' });
  }
});

// Multi-turn Gemini AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, topicContext, roleMode, model, systemInstruction } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Array de mensagens é obrigatório' });
    }

    const reply = await generateChatResponse({
      messages,
      topicContext,
      roleMode,
      model: model || 'gemini-3.8-flash',
      systemInstruction,
    });

    res.json({ success: true, reply });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar resposta do Gemini' });
  }
});

// Dev vs Prod Vite Integration
const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.use((_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} in ${isProd ? 'production' : 'development'} mode`);
});
