
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, ScheduleEvent } from '../types';
import { DAYS } from '../constants';
import { formatHHMM } from '../utils/timeUtils';
import { EventModal, BulkEventModal, BulkImportModal } from './Modals';

interface WeeklyCalendarProps {
  users: User[];
  schedule: ScheduleEvent[];
  onAddEvent: (e: ScheduleEvent) => void;
  onAddEvents: (e: ScheduleEvent[]) => void;
  onUpdateEvent: (e: ScheduleEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ users, schedule, onAddEvent, onAddEvents, onUpdateEvent, onDeleteEvent }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | undefined>();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    if (selectedUserId === 'all') return users;
    return users.filter(u => u.id === selectedUserId);
  }, [users, selectedUserId]);

  const handleEdit = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleAdd = () => {
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  const handleBulkAdd = (events: ScheduleEvent[]) => {
    onAddEvents(events);
  };

  const confirmDelete = (id: string) => {
    const event = schedule.find(e => e.id === id);
    if (event && window.confirm(`Remove event "${event.eventName}"?`)) {
      onDeleteEvent(id);
    }
    setActiveMenuId(null);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Filtering Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
        <div className="w-full sm:w-auto flex-1">
          <label htmlFor="user-filter" className="block text-sm font-medium text-slate-700 mb-2">
            Filter by Person
          </label>
          <select
            id="user-filter"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="all">Everyone</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setIsImportModalOpen(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm transition-all border border-slate-200">
            Import CSV
          </button>
          <button onClick={() => setIsBulkModalOpen(true)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm transition-all border border-indigo-100">
            Bulk Days
          </button>
          <button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm transition-all shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Add Event
          </button>
        </div>
      </div>

      <div className="space-y-8" ref={menuRef}>
        {filteredUsers.map(user => {
          const userEvents = schedule.filter(e => e.userId === user.id);
          
          return (
            <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible relative">
              <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center gap-3">
                <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                <div>
                  <h3 className="font-bold text-indigo-900">{user.name}</h3>
                  <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">{user.role || 'No role'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {DAYS.map(day => {
                  const dayEvents = userEvents
                    .filter(e => e.dayOfWeek === day)
                    .sort((a, b) => a.startTime - b.startTime);

                  return (
                    <div key={day} className="p-4 min-h-[140px]">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{day}</h4>
                      <div className="space-y-2">
                        {dayEvents.length > 0 ? (
                          dayEvents.map(event => (
                            <div 
                              key={event.id} 
                              className="group relative bg-indigo-600 text-white p-2 rounded-lg shadow-sm border-l-4 border-blue-400"
                            >
                              <div className="font-bold text-[11px] truncate pr-6" title={event.eventName}>
                                {event.eventName}
                              </div>
                              <div className="text-[9px] opacity-90 mt-0.5">
                                {formatHHMM(event.startTime)} - {formatHHMM(event.endTime)}
                              </div>

                              {/* Three Dot Menu Trigger */}
                              <div className="absolute top-1 right-1">
                                <button 
                                  onClick={(e) => toggleMenu(e, event.id)}
                                  className="p-1 text-white/60 hover:text-white hover:bg-white/20 rounded transition-all"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                  </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {activeMenuId === event.id && (
                                  <div className="absolute right-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <button 
                                      onClick={() => handleEdit(event)}
                                      className="w-full text-left px-3 py-1.5 text-[11px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                      Edit
                                    </button>
                                    <button 
                                      onClick={() => confirmDelete(event.id)}
                                      className="w-full text-left px-3 py-1.5 text-[11px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-300 italic py-2">No events</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={editingEvent ? onUpdateEvent : onAddEvent} 
        onDelete={onDeleteEvent}
        users={users}
        initialEvent={editingEvent} 
      />

      <BulkEventModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSaveBulk={handleBulkAdd}
        users={users}
      />

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={onAddEvents}
        users={users}
      />
    </div>
  );
};

export default WeeklyCalendar;
