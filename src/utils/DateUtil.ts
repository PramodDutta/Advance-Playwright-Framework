/**
 * DateUtil - small, dependency-free date helpers for the TTACart suite.
 *
 * The TTACart UI does not collect dates today, but a real ed-tech / e-commerce
 * suite quickly grows assertions like "order placed today", report file names
 * stamped with ISO timestamps, or fixtures that need a tomorrow / next-week
 * ISO string. Keeping this in `src/utils/` means students see the same
 * "one util per concern" pattern as `Logger`, `FileReader`, `DataFactory`.
 *
 *   const todayIso = DateUtil.todayIso();        // 2026-05-21
 *   const stamp    = DateUtil.fsTimestamp();     // 2026-05-21T16-23-44-123Z
 *   const tomorrow = DateUtil.daysFromNow(1);    // Date object, +1 day
 *
 * All methods are pure - no globals, no side effects, deterministic given a
 * Date argument so they remain test-friendly.
 */
export class DateUtil {
    /** Return today as `YYYY-MM-DD`. */
    static todayIso(now: Date = new Date()): string {
        const y = now.getUTCFullYear();
        const m = String(now.getUTCMonth() + 1).padStart(2, '0');
        const d = String(now.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * Filesystem-safe ISO timestamp: colons and dots replaced with hyphens so
     * the string can be used as a folder or log file name on every OS.
     *
     *   `2026-05-21T16-23-44-123Z`
     */
    static fsTimestamp(now: Date = new Date()): string {
        return now.toISOString().replace(/[:.]/g, '-');
    }

    /**
     * Return a new Date offset by `days` days from `from`. Negative values
     * move into the past.
     */
    static daysFromNow(days: number, from: Date = new Date()): Date {
        const d = new Date(from.getTime());
        d.setUTCDate(d.getUTCDate() + days);
        return d;
    }

    /**
     * Format a Date as the human-readable string `DD MMM YYYY` (e.g. `21 May 2026`).
     * Useful for matching strings the TTACart UI renders in "order placed on"
     * style messages.
     */
    static prettyDate(d: Date = new Date()): string {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = months[d.getUTCMonth()];
        const year = d.getUTCFullYear();
        return `${day} ${month} ${year}`;
    }

    /**
     * Difference between two dates in whole days (b - a). Always rounds down
     * so partial days are not over-counted.
     */
    static diffInDays(a: Date, b: Date): number {
        const MS_PER_DAY = 86_400_000;
        const aUTC = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
        const bUTC = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
        return Math.floor((bUTC - aUTC) / MS_PER_DAY);
    }

    /**
     * Returns true if `d` falls on a Saturday or Sunday (UTC).
     */
    static isWeekend(d: Date = new Date()): boolean {
        const day = d.getUTCDay();
        return day === 0 || day === 6;
    }
}
