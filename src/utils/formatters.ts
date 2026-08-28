// Format file size nicely
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Format date in Korean readable format
export function formatDate(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.round(diffHours * 60));
      return `${diffMins}분 전`;
    }
    if (diffHours < 24) {
      return `${Math.round(diffHours)}시간 전`;
    }
    
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return isoString;
  }
}

// Calculate NEIS Bytes (Korean = 3 bytes, ASCII/Space = 1 byte, CRLF = 2 bytes)
export function getNeisByteCount(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 10) {
      bytes += 2;
    } else if (code <= 0x007f) {
      bytes += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

// Get File Icon type description
export function getFileCategory(mimeType: string, filename: string): 'image' | 'video' | 'pdf' | 'document' | 'archive' | 'other' {
  const lowerName = filename.toLowerCase();
  if (mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(lowerName)) {
    return 'image';
  }
  if (mimeType.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/.test(lowerName)) {
    return 'video';
  }
  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return 'pdf';
  }
  if (/\.(hwp|hwpx|docx?|xlsx?|pptx?|txt)$/.test(lowerName) || mimeType.includes('officedocument') || mimeType.includes('hancom')) {
    return 'document';
  }
  if (/\.(zip|tar|gz|7z|rar)$/.test(lowerName) || mimeType.includes('zip') || mimeType.includes('compressed')) {
    return 'archive';
  }
  return 'other';
}
