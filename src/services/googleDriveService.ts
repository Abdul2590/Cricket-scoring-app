export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  description?: string;
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

/**
 * List files from Google Drive with optional name query
 */
export async function listDriveFiles(
  accessToken: string,
  searchQuery = ''
): Promise<DriveFileItem[]> {
  try {
    let q = 'trashed = false';
    if (searchQuery.trim()) {
      const sanitized = searchQuery.replace(/'/g, "\\'");
      q += ` and name contains '${sanitized}'`;
    }

    const fields = 'files(id,name,mimeType,modifiedTime,size,webViewLink,webContentLink,iconLink,description)';
    const params = new URLSearchParams({
      pageSize: '30',
      fields,
      orderBy: 'modifiedTime desc',
      q,
    });

    const res = await fetch(`${DRIVE_API_URL}/files?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Google Drive API error: ${res.status}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error: any) {
    console.error('Error listing Drive files:', error);
    throw error;
  }
}

/**
 * Upload JSON data (matches, fixtures, settings) as a file to Google Drive
 */
export async function uploadJsonToDrive(
  accessToken: string,
  fileName: string,
  content: object | string,
  description = 'CricLive Cricket Match Backup'
): Promise<DriveFileItem> {
  const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName.endsWith('.json') ? fileName : `${fileName}.json`,
    mimeType: 'application/json',
    description,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch(`${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Failed to upload file to Google Drive: ${res.status}`);
  }

  return await res.json();
}

/**
 * Upload scorecard / summary text or markdown file to Google Drive
 */
export async function uploadTextReportToDrive(
  accessToken: string,
  fileName: string,
  reportText: string,
  description = 'CricLive Match Scorecard Report'
): Promise<DriveFileItem> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName.endsWith('.txt') || fileName.endsWith('.md') ? fileName : `${fileName}.txt`,
    mimeType: 'text/plain',
    description,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    reportText +
    closeDelimiter;

  const res = await fetch(`${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Failed to upload report to Google Drive: ${res.status}`);
  }

  return await res.json();
}

/**
 * Download file content directly from Google Drive
 */
export async function downloadDriveFile(
  accessToken: string,
  fileId: string
): Promise<string> {
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Failed to download file: ${res.status}`);
  }

  return await res.text();
}

/**
 * Delete file from Google Drive (MUST be confirmed by user first)
 */
export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Failed to delete file from Google Drive: ${res.status}`);
  }
}

/**
 * Format bytes into human-readable size
 */
export function formatFileSize(bytes?: string | number): string {
  if (!bytes) return 'Unknown size';
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(b) || b <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${units[i] || 'B'}`;
}
