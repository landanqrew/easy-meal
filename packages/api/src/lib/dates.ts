// Date utility functions for meal planning

/** Get the Monday of the week containing the given date (UTC) */
export function getWeekStartMonday(date: Date): Date {
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + diff))
}
