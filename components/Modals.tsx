
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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  profile: { name: string, role: string, photo: string };
  onUpdateProfile: (name: string, role: string, photo: string) => void;
  currentPassword?: string;
  onUpdatePassword: (newPass: string) => void;
}> = ({ isOpen, onClose, profile, onUpdateProfile, currentPassword, onUpdatePassword }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system'>('profile');
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [photo, setPhoto] = useState(profile.photo);
  
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setRole(profile.role);
      setPhoto(profile.photo);
      setSecurityError('');
      setSecuritySuccess('');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    }
  }, [isOpen, profile]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(name, role, photo);
    onClose();
  };

  const handleSecuritySave = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (oldPass !== currentPassword) {
      setSecurityError('Current password is incorrect.');
      return;
    }
    if (newPass.length < 6) {
      setSecurityError('New password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setSecurityError('New passwords do not match.');
      return;
    }

    onUpdatePassword(newPass);
    setSecuritySuccess('Password updated successfully!');
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings">
      <div className="flex border-b border-slate-100 mb-6">
        <button onClick={() => setActiveTab('profile')} className={`flex-1 pb-3 text-xs font-bold transition-colors ${activeTab === 'profile' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Profile</button>
        <button onClick={() => setActiveTab('security')} className={`flex-1 pb-3 text-xs font-bold transition-colors ${activeTab === 'security' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Security</button>
        <button onClick={() => setActiveTab('system')} className={`flex-1 pb-3 text-xs font-bold transition-colors ${activeTab === 'system' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>System</button>
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
            <input required className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <input className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={role} onChange={e => setRole(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Photo URL</label>
            <input required className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-xs" value={photo} onChange={e => setPhoto(e.target.value)} />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-4 shadow-lg hover:bg-indigo-700 transition-all">Save Profile</button>
        </form>
      )}

      {activeTab === 'security' && (
        <form onSubmit={handleSecuritySave} className="space-y-4">
          {securityError && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg">{securityError}</div>}
          {securitySuccess && <div className="p-3 bg-green-50 text-green-600 text-xs font-bold rounded-lg">{securitySuccess}</div>}
          <input type="password" placeholder="Current Password" required className="w-full p-2 border border-slate-200 rounded-lg" value={oldPass} onChange={e => setOldPass(e.target.value)} />
          <input type="password" placeholder="New Password" required className="w-full p-2 border border-slate-200 rounded-lg" value={newPass} onChange={e => setNewPass(e.target.value)} />
          <input type="password" placeholder="Confirm New Password" required className="w-full p-2 border border-slate-200 rounded-lg" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
          <button type="submit" className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl mt-4">Update Password</button>
        </form>
      )}

      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Connection Diagnostics</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Local Connectivity</span>
                <span className={navigator.onLine ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{navigator.onLine ? 'Online' : 'Offline'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Sync Endpoint</span>
                <span className="text-slate-400 font-mono text-[10px]">restful-api.dev</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-500 leading-relaxed">
                <p className="font-bold text-slate-700 mb-1">Troubleshooting Tips:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Disable Ad-Blockers if sync is blocked.</li>
                  <li>Ensure your network allows <strong>CORS</strong> requests.</li>
                  <li>Check if a VPN or Firewall is restricting access.</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Local Storage</h4>
            <p className="text-[10px] text-slate-500">All your data is currently saved locally in your browser.</p>
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
    <Modal isOpen={isOpen} onClose={onClose} title={initialUser ? 'Edit Person' : 'Add Person'}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(formData); onClose(); }}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input required className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role (Optional)</label>
            <input className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
            <input type="email" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Photo URL</label>
          <div className="flex gap-3 items-center">
            <img src={formData.photo} alt="Preview" className="w-12 h-12 rounded-full border border-slate-200 object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')} />
            <input required className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs" 
              value={formData.photo} onChange={e => setFormData({ ...formData, photo: e.target.value })} />
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
            Save Person
          </button>
          {initialUser && (
            <button type="button" onClick={handleDelete} className="w-full py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors">
              Remove Person
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
    <Modal isOpen={isOpen} onClose={onClose} title={initialEvent ? 'Edit Event' : 'Add Event'}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(formData); onClose(); }}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
          <input required className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
            value={formData.eventName} onChange={e => setFormData({ ...formData, eventName: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Person</label>
          <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
            <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value as DayOfWeek })}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Times (HHMM)</label>
            <div className="flex items-center gap-2">
              <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formData.startTime} onChange={e => setFormData({...formData, startTime: parseInt(e.target.value)})} />
              <span>-</span>
              <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formData.endTime} onChange={e => setFormData({...formData, endTime: parseInt(e.target.value)})} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
            Save Event
          </button>
          {initialEvent && (
            <button type="button" onClick={handleDelete} className="w-full py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors">
              Remove Event
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
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
          <input required className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
            value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. Focus Time" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Person</label>
          <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={userId} onChange={e => setUserId(e.target.value)}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedDays.includes(day)
                    ? 'bg-indigo-600 text-white border-indigo-600'
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Start (HHMM)</label>
            <input type="number" required className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={startTime} onChange={e => setStartTime(parseInt(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End (HHMM)</label>
            <input type="number" required className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={endTime} onChange={e => setEndTime(parseInt(e.target.value))} />
          </div>
        </div>
        <button type="submit" className="w-full py-3 mt-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
          Create {selectedDays.length} Events
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
          currentColumn += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(currentColumn.trim());
          currentColumn = '';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Import Spreadsheet Data">
      <form className="space-y-4" onSubmit={handleImport}>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-[11px] text-slate-600">
          Paste rows in format: <strong>Event, Day, HHMM Start, HHMM End</strong>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Person</label>
          <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={userId} onChange={e => setUserId(e.target.value)}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <textarea 
            required 
            rows={8}
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" 
            placeholder='Sync, Monday, 0900, 1000'
            value={csvData} 
            onChange={e => setCsvData(e.target.value)} 
          />
        </div>
        <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
          Import Rows
        </button>
      </form>
    </Modal>
  );
};
