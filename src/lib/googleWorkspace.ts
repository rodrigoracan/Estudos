// Google Workspace API helper client using client-side OAuth Bearer token
// Covers Google Drive, Google Calendar, and Google Tasks

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated?: string;
}

// ----------------------------------------------------
// 1. GOOGLE DRIVE API
// ----------------------------------------------------
export async function listDriveFiles(accessToken: string): Promise<DriveFileItem[]> {
  const url = 'https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,webViewLink,createdTime,modifiedTime)&orderBy=modifiedTime%20desc';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Google Drive error: ${res.statusText}`);
  }
  const data = await res.json();
  return data.files || [];
}

export async function createDriveStudyNote(
  accessToken: string,
  fileName: string,
  content: string
): Promise<DriveFileItem> {
  // Using multipart upload to send metadata + text/markdown content
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: 'text/markdown',
    description: 'Backup de notas de estudo RACAN LEARN PLAN 2026',
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/markdown\r\n\r\n' +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Failed to create file on Google Drive: ${res.statusText}`);
  }

  return await res.json();
}

// ----------------------------------------------------
// 2. GOOGLE CALENDAR API
// ----------------------------------------------------
export async function listCalendarEvents(accessToken: string): Promise<CalendarEventItem[]> {
  const timeMin = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=10&singleEvents=true&orderBy=startTime`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Google Calendar error: ${res.statusText}`);
  }
  const data = await res.json();
  return data.items || [];
}

export async function createCalendarStudySession(
  accessToken: string,
  event: {
    summary: string;
    description: string;
    startDateTime: string; // ISO
    endDateTime: string;   // ISO
  }
): Promise<CalendarEventItem> {
  const body = {
    summary: event.summary,
    description: event.description,
    start: { dateTime: event.startDateTime },
    end: { dateTime: event.endDateTime },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 10 },
        { method: 'email', minutes: 30 }
      ]
    }
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Failed to create Google Calendar event: ${res.statusText}`);
  }

  return await res.json();
}

// ----------------------------------------------------
// 3. GOOGLE TASKS API
// ----------------------------------------------------
export async function listGoogleTasks(accessToken: string): Promise<GoogleTaskItem[]> {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=true&maxResults=20', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Google Tasks error: ${res.statusText}`);
  }
  const data = await res.json();
  return data.items || [];
}

export async function createGoogleTask(
  accessToken: string,
  task: {
    title: string;
    notes?: string;
    due?: string; // RFC 3339 timestamp (e.g. 2026-09-24T00:00:00.000Z)
  }
): Promise<GoogleTaskItem> {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Failed to create Google Task: ${res.statusText}`);
  }

  return await res.json();
}

export async function updateGoogleTaskStatus(
  accessToken: string,
  taskId: string,
  completed: boolean
): Promise<GoogleTaskItem> {
  const status = completed ? 'completed' : 'needsAction';
  const body = {
    id: taskId,
    status: status,
    ...(completed ? { completed: new Date().toISOString() } : {}),
  };

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Failed to update task: ${res.statusText}`);
  }

  return await res.json();
}
