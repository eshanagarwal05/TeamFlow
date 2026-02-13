
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface User {
  id: string;
  name: string;
  photo: string;
  email: string;
  role: string;
}

export interface ScheduleEvent {
  id: string;
  eventName: string;
  userId: string;
  dayOfWeek: DayOfWeek;
  startTime: number; // 24-hour format e.g., 1400
  endTime: number;   // 24-hour format e.g., 1600
}

export enum UserStatus {
  BUSY = 'Busy',
  IN_BETWEEN = 'In Between',
  FREE = 'Free'
}
