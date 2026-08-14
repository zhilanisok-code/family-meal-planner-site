const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function dateFromIso(iso) {
  if (!isValidIsoDate(iso)) return null;
  return new Date(`${iso}T00:00:00Z`);
}

export function isValidIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function isWeekday(iso) {
  const date = dateFromIso(iso);
  if (!date) return false;
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

export function isoToday(clock = new Date()) {
  const date = typeof clock === "function" ? clock() : clock;
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const valueByType = new Map(parts.map(({ type, value }) => [type, value]));
  return `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`;
}

export function addDays(iso, count) {
  if (typeof count !== "number" || !Number.isFinite(count)) return null;
  const date = dateFromIso(iso);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function weekStart(iso) {
  const date = dateFromIso(iso);
  if (!date) return null;
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return addDays(iso, -daysSinceMonday);
}

export function weekDates(iso) {
  const monday = weekStart(iso);
  return monday ? Array.from({ length: 7 }, (_, offset) => ({ iso: addDays(monday, offset) })) : [];
}
