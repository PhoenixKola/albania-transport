import type { Services } from "../types/feed";

function yyyymmdd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function dayKey(d: Date) {
  const n = d.getDay();
  if (n === 0) return "sunday";
  if (n === 1) return "monday";
  if (n === 2) return "tuesday";
  if (n === 3) return "wednesday";
  if (n === 4) return "thursday";
  if (n === 5) return "friday";
  return "saturday";
}

function inRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

export function isServiceActiveOnDate(services: Services, serviceId: string, d: Date) {
  const date = yyyymmdd(d);

  const ex = services.calendarDates.find(x => x.serviceId === serviceId && x.date === date);
  if (ex?.exceptionType === 1) return true;
  if (ex?.exceptionType === 2) return false;

  const cal = services.calendar.find(x => x.serviceId === serviceId);
  if (!cal) return false;
  if (!inRange(date, cal.startDate, cal.endDate)) return false;

  const k = dayKey(d) as keyof typeof cal;
  return Boolean(cal[k]);
}

function parseTimeToMinutes(t: string) {
  const [hh, mm, ss] = t.split(":").map(Number);
  return hh * 60 + mm + (ss >= 30 ? 1 : 0);
}

export function upcomingOccurrencesForTime(t: string, now: Date) {
  const mins = parseTimeToMinutes(t);
  const nowMins = now.getHours() * 60 + now.getMinutes();

  if (mins >= nowMins && mins < 24 * 60) return { dayOffset: 0, minutes: mins };
  if (mins >= 24 * 60) return { dayOffset: 0, minutes: mins };
  return { dayOffset: 1, minutes: mins };
}

export function minutesToLabel(mins: number) {
  const total = mins % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}