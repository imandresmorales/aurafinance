/**
 * timezoneSafeScheduler.js
 * Strict timezone and civil-date scheduler for financial deadlines and recurring commitments.
 * Prevents UTC midnight drift, DST offset rollover, and cross-timezone date misalignment.
 */

/**
 * Parses any date input into a robust local Civil Date object anchored at 12:00:00 local time.
 * This guarantees that DST transitions (+/- 1 hour) and local timezone offsets never roll over past midnight.
 * @param {string|number|Date} input
 * @param {number} anchorHour - Default 12 (noon)
 * @returns {Date}
 */
export function parseCivilDate(input, anchorHour = 12) {
  if (!input) return new Date();

  if (input instanceof Date) {
    if (isNaN(input.getTime())) return new Date();
    return new Date(input.getFullYear(), input.getMonth(), input.getDate(), anchorHour, 0, 0, 0);
  }

  if (typeof input === 'number') {
    const d = new Date(input);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), anchorHour, 0, 0, 0);
  }

  if (typeof input === 'string') {
    // Check for YYYY-MM-DD format
    const match = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, anchorHour, 0, 0, 0);
    }
    // Fallback parsing
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), anchorHour, 0, 0, 0);
    }
  }

  return new Date();
}

/**
 * Formats a date into a strict 'YYYY-MM-DD' civil string based on local calendar values.
 * @param {string|number|Date} input
 * @returns {string} 'YYYY-MM-DD'
 */
export function formatCivilDate(input) {
  const date = parseCivilDate(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks whether two dates represent the exact same calendar day (ignoring time/timezone).
 * @param {string|number|Date} dateA
 * @param {string|number|Date} dateB
 * @returns {boolean}
 */
export function isSameCivilDay(dateA, dateB) {
  const a = parseCivilDate(dateA);
  const b = parseCivilDate(dateB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Computes exact integer difference in calendar days between two dates (target - source).
 * DST-immune.
 * @param {string|number|Date} targetDate
 * @param {string|number|Date} sourceDate
 * @returns {number}
 */
export function calculateCivilDaysDiff(targetDate, sourceDate) {
  const target = parseCivilDate(targetDate);
  const source = parseCivilDate(sourceDate);

  // UTC noon comparison eliminates DST 23h/25h day distortions
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate(), 12);
  const utcSource = Date.UTC(source.getFullYear(), source.getMonth(), source.getDate(), 12);

  return Math.round((utcTarget - utcSource) / (1000 * 60 * 60 * 24));
}

/**
 * Adds a civil time interval (days, weeks, months, years) with calendar end-of-month pinning.
 * @param {string|number|Date} inputDate
 * @param {number} count
 * @param {'days'|'weeks'|'months'|'years'} unit
 * @param {boolean} pinToEndOfMonth - If true and source is last day of month, result will also be last day
 * @returns {Date}
 */
export function addCivilInterval(inputDate, count = 1, unit = 'months', pinToEndOfMonth = false) {
  const source = parseCivilDate(inputDate);
  const year = source.getFullYear();
  const month = source.getMonth();
  const day = source.getDate();

  const isLastDay = new Date(year, month + 1, 0).getDate() === day;

  switch (unit) {
    case 'days': {
      const result = new Date(year, month, day + count, 12, 0, 0, 0);
      return result;
    }
    case 'weeks': {
      const result = new Date(year, month, day + count * 7, 12, 0, 0, 0);
      return result;
    }
    case 'months': {
      const targetMonth = month + count;
      const daysInTargetMonth = new Date(year, targetMonth + 1, 0).getDate();
      const targetDay = (pinToEndOfMonth && isLastDay) ? daysInTargetMonth : Math.min(day, daysInTargetMonth);
      return new Date(year, targetMonth, targetDay, 12, 0, 0, 0);
    }
    case 'years': {
      const targetYear = year + count;
      const daysInTargetMonth = new Date(targetYear, month + 1, 0).getDate();
      const targetDay = (pinToEndOfMonth && isLastDay) ? daysInTargetMonth : Math.min(day, daysInTargetMonth);
      return new Date(targetYear, month, targetDay, 12, 0, 0, 0);
    }
    default:
      return source;
  }
}

/**
 * Generates future scheduled occurrence dates for a recurring rule without timezone drift.
 * @param {Object} rule - { frequency: 'daily'|'weekly'|'biweekly'|'monthly'|'quarterly'|'annual', dayOfMonth, dayOfWeek, pinEndOfMonth }
 * @param {string|Date} startDate - Initial start / next renewal date
 * @param {number} count - Number of occurrences to generate
 * @param {string|Date} referenceDate - Cutoff reference date (only occurrences >= referenceDate are returned)
 * @returns {Array<string>} Array of 'YYYY-MM-DD' strings
 */
export function generateNextCivilOccurrences(rule = {}, startDate, count = 6, referenceDate = null) {
  const initialDate = parseCivilDate(startDate);
  const cutoff = referenceDate ? parseCivilDate(referenceDate) : null;
  const frequency = (rule.frequency || 'monthly').toLowerCase();
  const occurrences = [];

  let current = initialDate;
  let attempts = 0;
  const maxAttempts = count * 20; // safety ceiling

  while (occurrences.length < count && attempts < maxAttempts) {
    attempts++;

    // Check if current meets cutoff condition
    if (!cutoff || calculateCivilDaysDiff(current, cutoff) >= 0) {
      occurrences.push(formatCivilDate(current));
    }

    // Step to next occurrence based on frequency
    if (frequency === 'daily') {
      current = addCivilInterval(current, 1, 'days');
    } else if (frequency === 'weekly') {
      current = addCivilInterval(current, 1, 'weeks');
    } else if (frequency === 'biweekly') {
      current = addCivilInterval(current, 2, 'weeks');
    } else if (frequency === 'monthly') {
      current = addCivilInterval(current, 1, 'months', Boolean(rule.pinEndOfMonth));
    } else if (frequency === 'quarterly') {
      current = addCivilInterval(current, 3, 'months', Boolean(rule.pinEndOfMonth));
    } else if (frequency === 'annual' || frequency === 'yearly') {
      current = addCivilInterval(current, 1, 'years', Boolean(rule.pinEndOfMonth));
    } else {
      // Default to monthly step
      current = addCivilInterval(current, 1, 'months');
    }
  }

  return occurrences;
}

/**
 * Returns diagnostic metadata about the current client's timezone and DST offset.
 * @returns {Object}
 */
export function detectTimezoneOffsetDrift() {
  const now = new Date();
  const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const timezoneOffsetMinutes = now.getTimezoneOffset(); // in minutes from UTC

  // Test standard vs daylight saving offset
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const isDst = timezoneOffsetMinutes < stdOffset;

  return {
    timezone: timezoneName,
    offsetMinutes: timezoneOffsetMinutes,
    offsetHours: -(timezoneOffsetMinutes / 60),
    isDst,
    isoLocalSample: formatCivilDate(now),
  };
}
