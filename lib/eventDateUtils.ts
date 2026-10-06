/**
 * Event date formatting utilities for single-day and multi-day events.
 */

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export interface FormattedEventSchedule {
  isMultiDay: boolean;
  dateLabel: string;
  timeLabel: string;
  fullScheduleLabel: string;
}

/**
 * Formats event dates cleanly for single-day and multi-day events.
 *
 * Example Outputs:
 * - Single day:
 *     dateLabel: "Thursday, October 15, 2026"
 *     timeLabel: "03:49 AM – 05:49 AM"
 *     fullScheduleLabel: "Thursday, October 15, 2026 • 03:49 AM – 05:49 AM"
 *
 * - Multi-day (different days):
 *     dateLabel: "Thu, Oct 15 – Sun, Oct 18, 2026"
 *     timeLabel: "Oct 15, 03:49 AM – Oct 18, 05:49 AM"
 *     fullScheduleLabel: "Thu, Oct 15, 2026, 03:49 AM – Sun, Oct 18, 2026, 05:49 AM"
 */
export function formatEventSchedule(
  startInput: string | Date | undefined,
  endInput: string | Date | undefined
): FormattedEventSchedule {
  if (!startInput) {
    return {
      isMultiDay: false,
      dateLabel: 'Date to be announced',
      timeLabel: 'Time to be announced',
      fullScheduleLabel: 'Date & Time to be announced'
    };
  }

  const start = new Date(startInput);
  const end = endInput ? new Date(endInput) : start;

  const validStart = !isNaN(start.getTime());
  const validEnd = !isNaN(end.getTime());

  if (!validStart) {
    return {
      isMultiDay: false,
      dateLabel: 'Date to be announced',
      timeLabel: 'Time to be announced',
      fullScheduleLabel: 'Date & Time to be announced'
    };
  }

  const sameDay = validEnd && isSameDay(start, end);

  const startTimeStr = start.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const endTimeStr = validEnd
    ? end.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  if (sameDay || !validEnd) {
    const singleDayStr = start.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const timeStr = endTimeStr ? `${startTimeStr} – ${endTimeStr}` : startTimeStr;

    return {
      isMultiDay: false,
      dateLabel: singleDayStr,
      timeLabel: timeStr,
      fullScheduleLabel: `${singleDayStr} • ${timeStr}`
    };
  }

  // Multi-day event
  const sameYear = start.getFullYear() === end.getFullYear();

  const startDateFormatted = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' })
  });

  const endDateFormatted = end.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const dateRangeStr = `${startDateFormatted} – ${endDateFormatted}`;
  const multiDayTimeStr = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startTimeStr} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${endTimeStr}`;

  return {
    isMultiDay: true,
    dateLabel: dateRangeStr,
    timeLabel: multiDayTimeStr,
    fullScheduleLabel: `${startDateFormatted}, ${startTimeStr} – ${endDateFormatted}, ${endTimeStr}`
  };
}
