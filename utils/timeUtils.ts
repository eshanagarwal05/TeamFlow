
import { DayOfWeek, ScheduleEvent, UserStatus } from '../types';

/**
 * Converts HHMM number format to total minutes from start of day
 */
export const hhmmToMinutes = (hhmm: number): number => {
  const hours = Math.floor(hhmm / 100);
  const mins = hhmm % 100;
  return hours * 60 + mins;
};

/**
 * Gets current day name in Monday-Friday format
 */
export const getCurrentDayName = (): DayOfWeek => {
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday
  if (dayIndex === 0 || dayIndex === 6) return 'Monday'; // Default for weekend is Mon for demo
  return days[dayIndex - 1];
};

/**
 * Gets current time in HHMM number format
 */
export const getCurrentHHMM = (): number => {
  const now = new Date();
  return now.getHours() * 100 + now.getMinutes();
};

/**
 * Computes the logic for Glide-style "IsCurrent" and "Math" columns
 */
export const getUserAvailability = (userId: string, schedule: ScheduleEvent[]) => {
  const currentDay = getCurrentDayName();
  const currentTime = getCurrentHHMM();
  const currentMinutes = hhmmToMinutes(currentTime);

  const todaysEvents = schedule.filter(e => e.userId === userId && e.dayOfWeek === currentDay);

  // 1. Check if "Busy" (IsCurrent equivalent)
  const activeEvent = todaysEvents.find(e => currentTime >= e.startTime && currentTime < e.endTime);
  if (activeEvent) {
    return { status: UserStatus.BUSY, event: activeEvent };
  }

  // 2. Check for "In Between" (< 60 mins gap to NEXT event)
  const nextEvents = todaysEvents
    .filter(e => e.startTime > currentTime)
    .sort((a, b) => a.startTime - b.startTime);

  if (nextEvents.length > 0) {
    const nextEvent = nextEvents[0];
    const nextStartMinutes = hhmmToMinutes(nextEvent.startTime);
    const gap = nextStartMinutes - currentMinutes;

    if (gap > 0 && gap < 60) {
      return { status: UserStatus.IN_BETWEEN, event: nextEvent, gap };
    }
  }

  // 3. Otherwise "Free"
  return { status: UserStatus.FREE, event: null };
};

export const formatHHMM = (hhmm: number): string => {
  const hours = Math.floor(hhmm / 100);
  const mins = hhmm % 100;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const mStr = mins < 10 ? `0${mins}` : mins;
  return `${h12}:${mStr} ${ampm}`;
};
