
import { User, ScheduleEvent, DayOfWeek } from './types';

export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Sarah Chen', role: 'Lead Developer', email: 'sarah.c@company.com', photo: 'https://picsum.photos/seed/sarah/200' },
  { id: '2', name: 'James Wilson', role: 'UI/UX Designer', email: 'james.w@company.com', photo: 'https://picsum.photos/seed/james/200' },
  { id: '3', name: 'Elena Rodriguez', role: 'Product Manager', email: 'elena.r@company.com', photo: 'https://picsum.photos/seed/elena/200' },
  { id: '4', name: 'David Kim', role: 'Backend Engineer', email: 'david.k@company.com', photo: 'https://picsum.photos/seed/david/200' },
  { id: '5', name: 'Amara Okoro', role: 'Marketing Lead', email: 'amara.o@company.com', photo: 'https://picsum.photos/seed/amara/200' }
];

export const MOCK_SCHEDULE: ScheduleEvent[] = [
  // Sarah Chen
  { id: 's1', userId: '1', eventName: 'Team Sync', dayOfWeek: 'Monday', startTime: 900, endTime: 1000 },
  { id: 's2', userId: '1', eventName: 'Code Review', dayOfWeek: 'Monday', startTime: 1400, endTime: 1530 },
  { id: 's3', userId: '1', eventName: 'Sprint Planning', dayOfWeek: 'Wednesday', startTime: 1000, endTime: 1200 },
  
  // James Wilson
  { id: 'j1', userId: '2', eventName: 'Design Critique', dayOfWeek: 'Tuesday', startTime: 1100, endTime: 1200 },
  { id: 'j2', userId: '2', eventName: 'Portfolio Review', dayOfWeek: 'Thursday', startTime: 1500, endTime: 1600 },
  
  // Elena Rodriguez
  { id: 'e1', userId: '3', eventName: 'Stakeholder Meeting', dayOfWeek: 'Monday', startTime: 1000, endTime: 1100 },
  { id: 'e2', userId: '3', eventName: 'Product Roadmap', dayOfWeek: 'Wednesday', startTime: 1300, endTime: 1430 },
  { id: 'e3', userId: '3', eventName: 'User Interviews', dayOfWeek: 'Friday', startTime: 900, endTime: 1200 },

  // Add some more random events to ensure variety
  { id: 'r1', userId: '4', eventName: 'Database Migration', dayOfWeek: 'Tuesday', startTime: 1400, endTime: 1600 },
  { id: 'r2', userId: '5', eventName: 'Ad Campaign Prep', dayOfWeek: 'Thursday', startTime: 1000, endTime: 1100 },
];
