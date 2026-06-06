/**
 * Date and Time utilities for the Apron timesheet application.
 */

/**
 * Calculates duration in decimal hours between two dates.
 */
export function calculateDurationHours(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return diffMs / (1000 * 60 * 60);
}

/**
 * Formats a decimal hour duration into a human-readable string.
 * Example: 8.25 -> "8h 15m"
 * Example: 0.75 -> "45m"
 */
export function formatDuration(hours: number): string {
  if (hours <= 0) return '0m';
  const hrs = Math.floor(hours);
  const mins = Math.round((hours - hrs) * 60);
  
  if (hrs === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hrs}h`;
  }
  return `${hrs}h ${mins}m`;
}

/**
 * Formats an ISO date string to a human-readable date.
 * Example: "2026-05-23T14:30:00Z" -> "Saturday, May 23"
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats an ISO date string to a short human-readable date.
 * Example: "2026-05-23T14:30:00Z" -> "May 23, 2026"
 */
export function formatDateShort(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats an ISO date string to a time string.
 * Example: "2026-05-23T14:30:00Z" -> "2:30 PM"
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns a live-update friendly duration string between a past ISO time and now.
 */
export function getElapsedTimeString(startIso: string): string {
  const start = new Date(startIso);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  if (diffMs <= 0) return '00:00:00';
  
  const diffSecs = Math.floor(diffMs / 1000);
  const hrs = Math.floor(diffSecs / 3600);
  const mins = Math.floor((diffSecs % 3600) / 60);
  const secs = diffSecs % 60;
  
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function doShiftsOverlap(shiftA: { startTime: string, endTime: string }, shiftB: { startTime: string, endTime: string }): boolean {
  const startA = new Date(shiftA.startTime).getTime();
  const endA = new Date(shiftA.endTime).getTime();
  const startB = new Date(shiftB.startTime).getTime();
  const endB = new Date(shiftB.endTime).getTime();
  
  return startA < endB && startB < endA;
}

export function hasOverlappingShifts(shifts: { startTime: string, endTime: string }[]): boolean {
  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      if (doShiftsOverlap(shifts[i], shifts[j])) {
        return true;
      }
    }
  }
  return false;
}
