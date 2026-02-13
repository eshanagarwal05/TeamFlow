
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from './components/Layout';
import LiveStatus from './components/LiveStatus';
import WeeklyCalendar from './components/WeeklyCalendar';
import Auth from './components/Auth';
import { SettingsModal } from './components/Modals';
import { MOCK_USERS, MOCK_SCHEDULE } from './constants';
import { User, ScheduleEvent } from './types';
import { 
  setCookie, 
  getCookie, 
  eraseCookie, 
  CloudService,
  LocalStorageService
} from './utils/persistence';

const SESSION_COOKIE = 'tf_session_v11';
const SYNC_HEARTBEAT_MS = 20000; // Increased frequency for better responsiveness

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'idle' | 'conflict'>('idle');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(Date.now());
  const [activeTab, setActiveTab] = useState<'live' | 'calendar'>('live');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // App Data State
  const [users, setUsers] = useState<User[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [passwordHash, setPasswordHash] = useState<string>('');
  const [profile, setProfile] = useState({ name: '', role: '', photo: '' });
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  
  const initialLoadDone = useRef(false);
  const syncTimeout = useRef<number | null>(null);
  const lastSyncHash = useRef<string>('');

  // Physical Connectivity Monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setSyncStatus('syncing');
      if (userEmail) reconcile(userEmail, true);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus('error');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userEmail]);

  /**
   * Reconciliation Logic
   */
  const reconcile = useCallback(async (email: string, force: boolean = false) => {
    if (!email) return;
    
    // Don't show syncing indicator for background heartbeats unless forced
    if (force) setSyncStatus('syncing');

    try {
      const { account: cloud, source } = await CloudService.fetchAccount(email);
      
      if (cloud && cloud.data) {
        // If we got remote data, sync it if it's newer
        if (force || cloud.data.lastUpdated > lastUpdated) {
          setUsers(cloud.data.users || []);
          setSchedule(cloud.data.schedule || []);
          setPasswordHash(cloud.data.passwordHash);
          const cloudProfile = {
            name: cloud.data.profileName || email.split('@')[0],
            role: cloud.data.profileRole || 'Team Member',
            photo: cloud.data.profilePhoto || `https://picsum.photos/seed/${email}/200`
          };
          setProfile(cloudProfile);
          setLastUpdated(cloud.data.lastUpdated);
          lastSyncHash.current = JSON.stringify({ u: cloud.data.users, s: cloud.data.schedule, p: cloudProfile });
        }
        
        // Update status based on reachability
        if (source === 'network') {
            setSyncStatus('synced');
            setLastSyncedAt(Date.now());
        } else {
            // We have internet, but the server is specifically failing/blocking us
            setSyncStatus(navigator.onLine ? 'idle' : 'error');
        }
      } else {
        setSyncStatus(navigator.onLine ? 'idle' : 'error');
      }
    } catch (e) {
      setSyncStatus('error');
    }
  }, [lastUpdated]);

  // Initial Session Check
  useEffect(() => {
    const session = getCookie(SESSION_COOKIE);
    if (session) {
      const cached = LocalStorageService.load(session);
      if (cached) {
        setUsers(cached.users);
        setSchedule(cached.schedule);
        if (cached.profile) setProfile(cached.profile);
        if (cached.ts) {
          setLastUpdated(cached.ts);
          lastSyncHash.current = JSON.stringify({ u: cached.users, s: cached.schedule, p: cached.profile });
        }
      }
      setUserEmail(session);
      reconcile(session, true).finally(() => {
        setIsLoaded(true);
        initialLoadDone.current = true;
      });
    } else {
      setIsLoaded(true);
    }
  }, [reconcile]);

  // Background Heartbeat
  useEffect(() => {
    if (!userEmail || isOffline) return;
    const interval = setInterval(() => {
      // Periodic check to try and upgrade from "Local Only" to "Synced"
      if (syncStatus === 'error' || syncStatus === 'idle' || syncStatus === 'synced') {
          reconcile(userEmail);
      }
    }, SYNC_HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [userEmail, reconcile, syncStatus, isOffline]);

  /**
   * AUTH HANDLER
   */
  const handleAuth = async (email: string, password: string, isSignUp: boolean) => {
    setAuthError(null);
    setIsLoaded(false);
    setSyncStatus('syncing');

    try {
      const { account: cloud, source } = await CloudService.fetchAccount(email);

      if (isSignUp) {
        if (cloud && cloud.data.email === email && source === 'network') {
          setAuthError('This email is already registered.');
          setIsLoaded(true);
          return;
        }
        
        const initialProfile = { name: email.split('@')[0], role: 'Team Lead', photo: `https://picsum.photos/seed/${email}/200` };
        const now = Date.now();
        const res = await CloudService.pushAccount(email, { 
          users: MOCK_USERS, 
          schedule: MOCK_SCHEDULE,
          profileName: initialProfile.name,
          profileRole: initialProfile.role,
          profilePhoto: initialProfile.photo,
          passwordHash: password,
          lastUpdated: now
        });
        
        if (!res.success && !navigator.onLine) {
          setAuthError('No internet connection. Cannot create account.');
          setIsLoaded(true);
          return;
        }

        setCookie(SESSION_COOKIE, email);
        setUserEmail(email);
        setPasswordHash(password);
        setUsers(MOCK_USERS);
        setSchedule(MOCK_SCHEDULE);
        setProfile(initialProfile);
        setLastUpdated(now);
        lastSyncHash.current = JSON.stringify({ u: MOCK_USERS, s: MOCK_SCHEDULE, p: initialProfile });
        setSyncStatus(res.success ? 'synced' : 'error');
      } else {
        if (!cloud || source !== 'network') {
          setAuthError('Account not found on cloud. Ensure you are online.');
          setIsLoaded(true);
          setSyncStatus('error');
          return;
        }
        
        if (cloud.data.passwordHash !== password) {
          setAuthError('Invalid password.');
          setIsLoaded(true);
          return;
        }

        const cloudProfile = {
          name: cloud.data.profileName || email.split('@')[0],
          role: cloud.data.profileRole || 'Member',
          photo: cloud.data.profilePhoto || ''
        };

        setCookie(SESSION_COOKIE, email);
        setUserEmail(email);
        setPasswordHash(password);
        setUsers(cloud.data.users);
        setSchedule(cloud.data.schedule);
        setProfile(cloudProfile);
        setLastUpdated(cloud.data.lastUpdated);
        lastSyncHash.current = JSON.stringify({ u: cloud.data.users, s: cloud.data.schedule, p: cloudProfile });
        setSyncStatus('synced');
      }
    } catch (e) {
      setAuthError('Cloud authentication failed.');
      setSyncStatus('error');
    }
    
    setIsLoaded(true);
    initialLoadDone.current = true;
  };

  /**
   * DEBOUNCED PUSH ENGINE
   */
  useEffect(() => {
    if (userEmail && initialLoadDone.current) {
      LocalStorageService.save(userEmail, { users, schedule, profile });
      
      const currentHash = JSON.stringify({ u: users, s: schedule, p: profile });
      if (currentHash === lastSyncHash.current) return;

      setSyncStatus('syncing');
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      
      syncTimeout.current = window.setTimeout(async () => {
        const result = await CloudService.pushAccount(userEmail, { 
          users, 
          schedule,
          profileName: profile.name,
          profileRole: profile.role,
          profilePhoto: profile.photo,
          passwordHash,
          lastUpdated: Date.now() 
        });

        if (result.success) {
          setSyncStatus('synced');
          setLastSyncedAt(Date.now());
          lastSyncHash.current = currentHash;
        } else if (result.error === 'Conflict') {
          setSyncStatus('conflict');
        } else {
          // Keep trying in the background if it failed due to server issues
          setSyncStatus(navigator.onLine ? 'idle' : 'error');
        }
      }, 2000); // Faster debounce for snappier feel
    }
  }, [users, schedule, profile, userEmail, passwordHash]);

  const handleLogout = () => {
    eraseCookie(SESSION_COOKIE);
    setUserEmail(null);
    setUsers([]);
    setSchedule([]);
    setPasswordHash('');
    setProfile({ name: '', role: '', photo: '' });
    initialLoadDone.current = false;
    lastSyncHash.current = '';
  };

  // UI Handlers
  const triggerSync = () => userEmail && reconcile(userEmail, true);
  const updateProfile = (name: string, role: string, photo: string) => {
    setProfile({ name, role, photo });
    setLastUpdated(Date.now());
  };
  const updatePassword = (newPass: string) => {
    setPasswordHash(newPass);
    setLastUpdated(Date.now());
  };
  const addUser = (user: User) => { setUsers([...users, user]); setLastUpdated(Date.now()); };
  const updateUser = (u: User) => { setUsers(users.map(old => old.id === u.id ? u : old)); setLastUpdated(Date.now()); };
  const deleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    setSchedule(schedule.filter(s => s.userId !== id));
    setLastUpdated(Date.now());
  };
  const reorderUser = (id: string, dir: 'up' | 'down') => {
    const idx = users.findIndex(u => u.id === id);
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= users.length) return;
    const nextUsers = [...users];
    [nextUsers[idx], nextUsers[target]] = [nextUsers[target], nextUsers[idx]];
    setUsers(nextUsers);
    setLastUpdated(Date.now());
  };
  const addEvent = (e: ScheduleEvent) => { setSchedule([...schedule, e]); setLastUpdated(Date.now()); };
  const addEvents = (es: ScheduleEvent[]) => { setSchedule([...schedule, ...es]); setLastUpdated(Date.now()); };
  const updateEvent = (e: ScheduleEvent) => { setSchedule(schedule.map(s => s.id === e.id ? e : s)); setLastUpdated(Date.now()); };
  const deleteEvent = (id: string) => { setSchedule(schedule.filter(s => s.id !== id)); setLastUpdated(Date.now()); };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
        <div className="relative mb-8">
           <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent shadow-xl"></div>
           <div className="absolute inset-0 flex items-center justify-center text-indigo-600 font-black text-xl">TF</div>
        </div>
        <p className="text-slate-700 font-bold text-lg">Initializing TeamFlow Engine</p>
        <p className="text-slate-400 text-xs mt-3 uppercase tracking-widest font-bold">Connecting to global cloud...</p>
      </div>
    );
  }

  if (!userEmail) {
    return <Auth onAuth={handleAuth} error={authError} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userEmail={userEmail} 
      profile={profile}
      onLogout={handleLogout}
      onOpenSettings={() => setIsSettingsOpen(true)}
      syncStatus={syncStatus}
      isOffline={isOffline}
      lastSyncedAt={lastSyncedAt}
      onTriggerSync={triggerSync}
    >
      {activeTab === 'live' ? (
        <LiveStatus 
          users={users} 
          schedule={schedule} 
          onAddUser={addUser}
          onUpdateUser={updateUser}
          onDeleteUser={deleteUser}
          onReorderUser={reorderUser}
        />
      ) : (
        <WeeklyCalendar 
          users={users} 
          schedule={schedule} 
          onAddEvent={addEvent}
          onAddEvents={addEvents}
          onUpdateEvent={updateEvent}
          onDeleteEvent={deleteEvent}
        />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onUpdateProfile={updateProfile}
        currentPassword={passwordHash}
        onUpdatePassword={updatePassword}
      />
    </Layout>
  );
};

export default App;
