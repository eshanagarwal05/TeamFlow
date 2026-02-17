
import React, { useState, useEffect } from 'react';
import { User, ScheduleEvent, DayOfWeek } from '../types';
import { DAYS } from '../constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] border border-white/20">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
          <button onClick={onClose} className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  profile: { name: string, role: string, photo: string };
  onUpdateProfile: (name: string, role: string, photo: string) => void;
  syncKey: string | null;
  onGenerateKey: () => void;
  onJoinTeam: (key: string) => Promise<boolean>;
}> = ({ isOpen, onClose, profile, onUpdateProfile, syncKey, onGenerateKey, onJoinTeam }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'sync' | 'system'>('profile');
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [photo, setPhoto] = useState(profile.photo);
  const [joinKey, setJoinKey] = useState('');
  const [joinStatus, setJoinStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setRole(profile.role);
      setPhoto(profile.photo);
      setJoinStatus('idle');
      setJoinKey('');
    }
  }, [isOpen, profile]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(name, role, photo);
    onClose();
  };

  const handleJoin = async () => {
    if (!joinKey.trim()) return;
    setJoinStatus('loading');
    const success = await onJoinTeam(joinKey.trim());
    setJoinStatus(success ? 'success' : 'error');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account & Team">
      <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8">
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Profile</button>
        <button onClick={() => setActiveTab('sync')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sync' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Sync & Team</button>
        <button onClick={() => setActiveTab('system')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'system' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>System</button>
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-6">
             <div className="relative group">
               <img src={photo || 'https://via.placeholder.com/100'} className="w-24 h-24 rounded-[2rem] object-cover shadow-xl border-4 border-indigo-50" />
               <div className="absolute inset-0 bg-indigo-600/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </div>
             </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Full Name</label>
              <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Professional Role</label>
              <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" value={role} onChange={e => setRole(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Avatar Source URL</label>
              <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-xs font-mono text-slate-400" value={photo} onChange={e => setPhoto(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">Save Profile Changes</button>
        </form>
      )}

      {activeTab === 'sync' && (
        <div className="space-y-8">
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
             <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826L10.242 9.242" /></svg>
               Your Device Link
             </h4>
             {syncKey ? (
               <div className="space-y-4">
                 <div className="bg-white p-4 rounded-2xl border border-indigo-100 flex justify-between items-center group">
                    <span className="font-black text-xl text-indigo-900 tracking-tighter">{syncKey}</span>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(syncKey); alert('Key copied! Share it with team members.'); }}
                      className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800"
                    >
                      Copy
                    </button>
                 </div>
                 <p className="text-[10px] text-indigo-500 font-medium leading-relaxed">Share this key to link other devices or team members to this schedule.</p>
               </div>
             ) : (
               <button onClick={onGenerateKey} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Generate New Sync Key</button>
             )}
          </div>

          <div className="relative">
             <div className="absolute inset-0 flex items-center" aria-hidden="true">
               <div className="w-full border-t border-slate-100"></div>
             </div>
             <div className="relative flex justify-center text-xs font-black uppercase tracking-[0.3em] text-slate-300">
               <span className="bg-white px-4">OR</span>
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Join Existing Team</h4>
             <div className="flex gap-2">
               <input 
                 className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-black text-indigo-900 placeholder:text-slate-300 placeholder:font-bold" 
                 placeholder="TF-XXXXX" 
                 value={joinKey}
                 onChange={e => setJoinKey(e.target.value.toUpperCase())}
               />
               <button 
                 onClick={handleJoin}
                 disabled={joinStatus === 'loading'}
                 className="px-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
               >
                 {joinStatus === 'loading' ? '...' : 'Join'}
               </button>
             </div>
             {joinStatus === 'error' && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center">Team Not Found</p>}
             {joinStatus === 'success' && <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest text-center">Connected Successfully!</p>}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">System Status v15.0</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">Connectivity</span>
                <span className={navigator.onLine ? 'text-emerald-600' : 'text-red-600'}>{navigator.onLine ? 'Online' : 'Offline'}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">Database</span>
                <span className="text-emerald-600 font-mono text-[9px]">SUPABASE (PG)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">Cache Layer</span>
                <span className="text-indigo-600">Active</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
             <p className="text-[10px] font-bold text-amber-700 leading-relaxed italic">
               Note: You are connected to a real PostgreSQL database. Please ensure you have configured your environment variables correctly.
             </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export const UserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  onDelete?: (id: string) => void;
  initialUser?: User;
}> = ({ isOpen, onClose, onSave, onDelete, initialUser }) => {
  const [formData, setFormData] = useState<User>({
    id: '', name: '', role: '', email: '', photo: ''
  });

  useEffect(() => {
    if (initialUser) setFormData(initialUser);
    else setFormData({ id: Math.random().toString(36).substr(2, 9), name: '', role: '', email: '', photo: `https://picsum.photos/seed/${Math.random()}/200` });
  }, [initialUser, isOpen]);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (initialUser && onDelete && window.confirm(`Are you sure you want to remove ${initialUser.name}? This will also remove all their scheduled events.`)) {
      onDelete(initialUser.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialUser ? 'Edit Person' : 'New Team Member'}>
      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(formData); onClose(); }}>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Full Name</label>
          <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" 
            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Role</label>
            <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" 
              value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Avatar URL</label>
          <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <img src={formData.photo} alt="Preview" className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')} />
            <input required className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-mono text-slate-400" 
              value={formData.photo} onChange={e => setFormData({ ...formData, photo: e.target.value })} />
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            Confirm Profile
          </button>
          {initialUser && (
            <button type="button" onClick={handleDelete} className="w-full py-3 text-red-500 font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 rounded-2xl transition-colors">
              Permanently Remove
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export const EventModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void;
  onDelete?: (id: string) => void;
  users: User[];
  initialEvent?: ScheduleEvent;
}> = ({ isOpen, onClose, onSave, onDelete, users, initialEvent }) => {
  const [formData, setFormData] = useState<ScheduleEvent>({
    id: '', eventName: '', userId: '', dayOfWeek: 'Monday', startTime: 900, endTime: 1000
  });

  useEffect(() => {
    if (initialEvent) setFormData(initialEvent);
    else setFormData({ id: Math.random().toString(36).substr(2, 9), eventName: '', userId: users[0]?.id || '', dayOfWeek: 'Monday', startTime: 900, endTime: 1000 });
  }, [initialEvent, isOpen, users]);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (initialEvent && onDelete && window.confirm(`Remove the event "${initialEvent.eventName}"?`)) {
      onDelete(initialEvent.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialEvent ? 'Edit Event' : 'New Schedule Event'}>
      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(formData); onClose(); }}>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Event Title</label>
          <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" 
            value={formData.eventName} onChange={e => setFormData({ ...formData, eventName: e.target.value })} />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assign To</label>
          <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700 appearance-none"
            value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Day</label>
            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700 appearance-none"
              value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value as DayOfWeek })}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Time (HHMM)</label>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <input type="number" className="w-full bg-transparent border-none text-center font-bold text-slate-700 focus:ring-0 p-2" value={formData.startTime} onChange={e => setFormData({...formData, startTime: parseInt(e.target.value)})} />
              <span className="text-slate-300">-</span>
              <input type="number" className="w-full bg-transparent border-none text-center font-bold text-slate-700 focus:ring-0 p-2" value={formData.endTime} onChange={e => setFormData({...formData, endTime: parseInt(e.target.value)})} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            Save Schedule
          </button>
          {initialEvent && (
            <button type="button" onClick={handleDelete} className="w-full py-3 text-red-500 font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 rounded-2xl transition-colors">
              Delete Event
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export const BulkEventModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSaveBulk: (events: ScheduleEvent[]) => void;
  users: User[];
}> = ({ isOpen, onClose, onSaveBulk, users }) => {
  const [eventName, setEventName] = useState('');
  const [userId, setUserId] = useState(users[0]?.id || '');
  const [startTime, setStartTime] = useState(900);
  const [endTime, setEndTime] = useState(1000);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  useEffect(() => {
    if (users.length > 0 && !userId) setUserId(users[0].id);
  }, [users, userId]);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      alert("Please select at least one day.");
      return;
    }
    const newEvents: ScheduleEvent[] = selectedDays.map(day => ({
      id: Math.random().toString(36).substr(2, 9),
      eventName,
      userId,
      dayOfWeek: day,
      startTime,
      endTime
    }));
    onSaveBulk(newEvents);
    onClose();
    setEventName('');
    setSelectedDays([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Add Days">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Event Name</label>
          <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700" 
            value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. Focus Time" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Person</label>
          <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700 appearance-none"
            value={userId} onChange={e => setUserId(e.target.value)}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Select Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  selectedDays.includes(day)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Start HHMM</label>
            <input type="number" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-0" value={startTime} onChange={e => setStartTime(parseInt(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">End HHMM</label>
            <input type="number" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-0" value={endTime} onChange={e => setEndTime(parseInt(e.target.value))} />
          </div>
        </div>
        <button type="submit" className="w-full py-5 mt-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          Bulk Create {selectedDays.length} Events
        </button>
      </form>
    </Modal>
  );
};

export const BulkImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImport: (events: ScheduleEvent[]) => void;
  users: User[];
}> = ({ isOpen, onClose, onImport, users }) => {
  const [csvData, setCsvData] = useState('');
  const [userId, setUserId] = useState(users[0]?.id || '');

  useEffect(() => {
    if (users.length > 0 && !userId) setUserId(users[0].id);
  }, [users, userId]);

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    const rows = csvData.split('\n').filter(r => r.trim());
    const newEvents: ScheduleEvent[] = [];

    rows.forEach((row, index) => {
      const columns: string[] = [];
      let currentColumn = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"' && inQuotes && i + 1 < row.length && row[i+1] === '"') {
          currentColumn += '"'; i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(currentColumn.trim()); currentColumn = '';
        } else {
          currentColumn += char;
        }
      }
      columns.push(currentColumn.trim());

      const [name, day, start, end] = columns;
      if (name && day && start && end) {
        const matchedDay = DAYS.find(d => d.toLowerCase() === day.toLowerCase());
        if (matchedDay) {
          const startTime = parseInt(start.replace(/[^0-9]/g, ''));
          const endTime = parseInt(end.replace(/[^0-9]/g, ''));
          if (!isNaN(startTime) && !isNaN(endTime)) {
            newEvents.push({
              id: Math.random().toString(36).substr(2, 9),
              eventName: name,
              userId,
              dayOfWeek: matchedDay,
              startTime,
              endTime
            });
          }
        }
      }
    });

    if (newEvents.length === 0) {
      alert("No valid rows found. Check format: Event, Day, StartTime, EndTime");
      return;
    }

    onImport(newEvents);
    onClose();
    setCsvData('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CSV Bulk Import">
      <form className="space-y-6" onSubmit={handleImport}>
        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Instructions</p>
          <p className="text-[11px] font-medium text-slate-600 leading-relaxed">Paste rows from your sheet in the following format:<br/><strong className="text-indigo-600">Event Title, Day, HHMM Start, HHMM End</strong></p>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Target Team Member</label>
          <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700 appearance-none"
            value={userId} onChange={e => setUserId(e.target.value)}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <textarea 
            required 
            rows={8}
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-50 outline-none text-sm font-mono text-slate-600" 
            placeholder='Weekly Sync, Monday, 0900, 1000'
            value={csvData} 
            onChange={e => setCsvData(e.target.value)} 
          />
        </div>
        <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          Execute Import
        </button>
      </form>
    </Modal>
  );
};
