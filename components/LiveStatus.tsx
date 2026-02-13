
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, ScheduleEvent, UserStatus } from '../types';
import { getUserAvailability } from '../utils/timeUtils';
import { UserModal } from './Modals';

interface LiveStatusProps {
  users: User[];
  schedule: ScheduleEvent[];
  onAddUser: (u: User) => void;
  onUpdateUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  onReorderUser: (id: string, direction: 'up' | 'down') => void;
}

const LiveStatus: React.FC<LiveStatusProps> = ({ users, schedule, onAddUser, onUpdateUser, onDeleteUser, onReorderUser }) => {
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState(new Date().toLocaleTimeString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(new Date().toLocaleTimeString());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const usersWithStatus = useMemo(() => {
    return users.map(user => ({
      ...user,
      availability: getUserAvailability(user.id, schedule)
    }));
  }, [users, schedule, currentTimeStr]);

  const filteredUsers = showFreeOnly 
    ? usersWithStatus.filter(u => u.availability.status === UserStatus.FREE)
    : usersWithStatus;

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.BUSY: return 'bg-red-100 text-red-700 border-red-200';
      case UserStatus.IN_BETWEEN: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case UserStatus.FREE: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIconColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.BUSY: return 'bg-red-500';
      case UserStatus.IN_BETWEEN: return 'bg-yellow-500';
      case UserStatus.FREE: return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleAdd = () => {
    setEditingUser(undefined);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user && window.confirm(`Remove ${user.name}? This will also delete their schedule.`)) {
      onDeleteUser(id);
    }
    setActiveMenuId(null);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-800">Live Availability</h2>
          <p className="text-slate-500 text-xs">Updated: {currentTimeStr}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Free Only</span>
            <button 
              onClick={() => setShowFreeOnly(!showFreeOnly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                showFreeOnly ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showFreeOnly ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Add Person
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" ref={menuRef}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user, idx) => (
            <div key={user.id} className="group bg-white rounded-xl shadow-sm border border-slate-100 flex p-4 items-center gap-4 transition-all hover:shadow-md relative overflow-visible">
              <div className="relative">
                <img src={user.photo} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${getStatusIconColor(user.availability.status)}`}></div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{user.name}</h3>
                    <p className="text-xs text-slate-500">{user.role || 'No role'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(user.availability.status)}`}>
                    {user.availability.status}
                  </span>
                </div>
                
                <div className="mt-2 text-xs text-slate-600">
                  {user.availability.status === UserStatus.BUSY && (
                    <p>Current: <span className="font-semibold text-red-600">{user.availability.event?.eventName}</span></p>
                  )}
                  {user.availability.status === UserStatus.IN_BETWEEN && (
                    <p>Next: <span className="font-semibold text-yellow-600">{user.availability.event?.eventName}</span> in {user.availability.gap}m</p>
                  )}
                  {user.availability.status === UserStatus.FREE && (
                    <p className="text-green-600 italic">No scheduled events</p>
                  )}
                </div>
              </div>

              {/* Three Dot Menu Trigger */}
              <div className="relative">
                <button 
                  onClick={(e) => toggleMenu(e, user.id)}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {activeMenuId === user.id && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-200">
                    <button 
                      onClick={() => handleEdit(user)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Edit Profile
                    </button>
                    <div className="border-t border-slate-50 my-1"></div>
                    <button 
                      disabled={idx === 0}
                      onClick={() => onReorderUser(user.id, 'up')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      Move Up
                    </button>
                    <button 
                      disabled={idx === users.length - 1}
                      onClick={() => onReorderUser(user.id, 'down')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      Move Down
                    </button>
                    <div className="border-t border-slate-50 my-1"></div>
                    <button 
                      onClick={() => confirmDelete(user.id)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Remove Person
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
            No users match current filters.
          </div>
        )}
      </div>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={editingUser ? onUpdateUser : onAddUser} 
        onDelete={onDeleteUser}
        initialUser={editingUser} 
      />
    </div>
  );
};

export default LiveStatus;
