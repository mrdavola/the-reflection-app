// Pure helpers for streaks and growth analytics.
// All date arithmetic uses the user's local timezone — never UTC.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Local-time midnight for a given Date (returns a new Date). */
function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Encode a local date as YYYY-MM-DD (no UTC conversion). */
function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Distinct local-day keys derived from ISO date strings. */
function uniqueLocalDayKeys(dates: string[]): Set<string> {
  const set = new Set<string>();
  for (const iso of dates) {
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) continue;
    set.add(localDayKey(t));
  }
  return set;
}

/**
 * Consecutive days (in the user's local TZ) ending at today (or yesterday if
 * today has no reflection yet) on which at least one reflection was logged.
 */
export function computeCurrentStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const days = uniqueLocalDayKeys(dates);
  if (days.size === 0) return 0;

  const today = startOfLocalDay(new Date());
  const todayKey = localDayKey(today);

  // Anchor: today if logged today, otherwise yesterday (so a streak doesn't
  // collapse to 0 just because the user hasn't reflected yet today).
  let cursor: Date;
  if (days.has(todayKey)) {
    cursor = today;
  } else {
    const yesterday = new Date(today.getTime() - MS_PER_DAY);
    if (!days.has(localDayKey(yesterday))) return 0;
    cursor = yesterday;
  }

  let count = 0;
  while (days.has(localDayKey(cursor))) {
    count += 1;
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }
  return count;
}

/**
 * Longest run of consecutive local days with at least one reflection,
 * across the entire history.
 */
export function computeLongestStreak(dates: string[]): number {
  const days = uniqueLocalDayKeys(dates);
  if (days.size === 0) return 0;

  // Convert keys back to sortable timestamps for run-detection.
  const timestamps = Array.from(days)
    .map((key) => {
      const [y, m, d] = key.split("-").map(Number);
      return new Date(y, (m ?? 1) - 1, d ?? 1).getTime();
    })
    .sort((a, b) => a - b);

  let longest = 1;
  let current = 1;
  for (let i = 1; i < timestamps.length; i += 1) {
    const diff = Math.round((timestamps[i] - timestamps[i - 1]) / MS_PER_DAY);
    if (diff === 1) {
      current += 1;
      if (current > longest) longest = current;
    } else if (diff > 1) {
      current = 1;
    }
  }
  return longest;
}

/**
 * Reflection count per week for the last 12 weeks (oldest first).
 * `weekStart` is a local-date YYYY-MM-DD anchored on Monday.
 */
export function reflectionsByWeek(
  dates: string[],
): { weekStart: string; count: number }[] {
  const today = startOfLocalDay(new Date());
  // Anchor "this week" to Monday in local time.
  const dayOfWeek = today.getDay(); // 0 = Sun … 6 = Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const thisMonday = new Date(today.getTime() - daysSinceMonday * MS_PER_DAY);

  // Build 12 buckets, oldest first.
  const buckets: { weekStart: string; count: number; ts: number }[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const start = new Date(thisMonday.getTime() - i * 7 * MS_PER_DAY);
    buckets.push({ weekStart: localDayKey(start), count: 0, ts: start.getTime() });
  }
  const earliestTs = buckets[0].ts;
  const latestTs = buckets[buckets.length - 1].ts + 7 * MS_PER_DAY;

  for (const iso of dates) {
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) continue;
    const tsLocal = startOfLocalDay(t).getTime();
    if (tsLocal < earliestTs || tsLocal >= latestTs) continue;
    const idx = Math.floor((tsLocal - earliestTs) / (7 * MS_PER_DAY));
    if (idx >= 0 && idx < buckets.length) buckets[idx].count += 1;
  }

  return buckets.map(({ weekStart, count }) => ({ weekStart, count }));
}
