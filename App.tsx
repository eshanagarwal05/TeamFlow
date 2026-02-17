
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from './components/Layout';
import LiveStatus from './components/LiveStatus';
import WeeklyCalendar from './components/WeeklyCalendar';
import Auth from './components/Auth';
import GeminiAssistant from './components/GeminiAssistant';
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

// Version bump for cookie to ensure clean state for DB migration
const SESSION_COOKIE = 'tf_session_v15'; 
const SYNC_HEARTBEAT_MS = 15000; // Poll more frequently with real DB

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncKey, setSyncKey] = useState<string | null>(null);
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
  const [profile, setProfile] = useState({ name: '', role: '', photo: '' });
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  
  const initialLoadDone = useRef(false);
  const syncTimeout = useRef<number | null>(null);
  const lastSyncHash = useRef<string>('');

  // Physical Connectivity Monitor
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => { setIsOffline(true); setSyncStatus('error'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  /**
   * Sync Key Management
   */
  const handleJoinTeam = async (newKey: string) => {
    setSyncStatus('syncing');
    const { data, source } = await CloudService.fetchBySyncKey(newKey);
    if (data) {
      setUsers(data.users || []);
      setSchedule(data.schedule || []);
      setLastUpdated(data.lastUpdated);
      setSyncKey(newKey);
      localStorage.setItem(`tf_sync_key_${userEmail}`, newKey);
      setSyncStatus(source === 'network' ? 'synced' : 'idle');
      setLastSyncedAt(Date.now());
      return true;
    } else {
      // New team, initialize empty
      setUsers([]);
      setSchedule([]);
      setSyncKey(newKey);
      localStorage.setItem(`tf_sync_key_${userEmail}`, newKey);
      setSyncStatus('idle');
      return true;
    }
  };

  /**
   * Background Reconciliation
   */
  const reconcile = useCallback(async (key: string, force: boolean = false) => {
    if (!key || !navigator.onLine) return;
    if (force) setSyncStatus('syncing');

    try {
      const { data, source } = await CloudService.fetchBySyncKey(key);
      if (data && data.lastUpdated > lastUpdated) {
        setUsers(data.users || []);
        setSchedule(data.schedule || []);
        setLastUpdated(data.lastUpdated);
        lastSyncHash.current = JSON.stringify({ u: data.users, s: data.schedule });
        setSyncStatus(source === 'network' ? 'synced' : 'idle');
        setLastSyncedAt(Date.now());
      } else {
        setSyncStatus(source === 'network' ? 'synced' : source === 'restricted' ? 'error' : 'idle');
      }
    } catch (e) {
      setSyncStatus('error');
    }
  }, [lastUpdated]);

  // Initial Load
  useEffect(() => {
    const session = getCookie(SESSION_COOKIE);
    if (session) {
      const storedKey = localStorage.getItem(`tf_sync_key_${session}`);
      setSyncKey(storedKey);

      const cached = LocalStorageService.load(session);
      if (cached) {
        setUsers(cached.users || []);
        setSchedule(cached.schedule || []);
        setProfile(cached.profile || { name: session.split('@')[0], role: 'Lead', photo: `https://picsum.photos/seed/${session}/200` });
        setLastUpdated(cached.ts || 0);
      } else {
        setUsers(MOCK_USERS);
        setSchedule(MOCK_SCHEDULE);
        setProfile({ name: session.split('@')[0], role: 'Lead', photo: `https://picsum.photos/seed/${session}/200` });
      }
      
      setUserEmail(session);
      setIsLoaded(true);

      if (storedKey) {
        reconcile(storedKey, true).finally(() => { initialLoadDone.current = true; });
      } else {
        initialLoadDone.current = true;
      }
    } else {
      setIsLoaded(true);
    }
  }, [reconcile]);

  // Sync Heartbeat
  useEffect(() => {
    if (!syncKey || isOffline) return;
    const interval = setInterval(() => reconcile(syncKey), SYNC_HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [syncKey, reconcile, isOffline]);

  /**
   * Debounced Push Engine
   */
  useEffect(() => {
    if (userEmail && initialLoadDone.current && syncKey) {
      LocalStorageService.save(userEmail, { users, schedule, profile });
      
      const currentHash = JSON.stringify({ u: users, s: schedule });
      if (currentHash === lastSyncHash.current) return;

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = window.setTimeout(async () => {
        setSyncStatus('syncing');
        const result = await CloudService.pushBySyncKey(syncKey, { users, schedule });
        if (result.success) {
          setSyncStatus('synced');
          setLastSyncedAt(Date.now());
          lastSyncHash.current = currentHash;
        } else {
          setSyncStatus(result.isRestricted ? 'error' : 'idle');
        }
      }, 2000); // Faster debounce for real DB
    }
  }, [users, schedule, profile, userEmail, syncKey]);

  const handleAuth = async (email: string, password: string, isSignUp: boolean) => {
    setAuthError(null);
    setCookie(SESSION_COOKIE, email);
    setUserEmail(email);
    const storedKey = localStorage.getItem(`tf_sync_key_${email}`);
    if (storedKey) setSyncKey(storedKey);
    initialLoadDone.current = true;
  };

  const handleLogout = () => {
    eraseCookie(SESSION_COOKIE);
    setUserEmail(null);
    setSyncKey(null);
    setUsers([]);
    setSchedule([]);
    initialLoadDone.current = false;
  };

  if (!isLoaded) return null;
  if (!userEmail) return <Auth onAuth={handleAuth} error={authError} />;

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
      onTriggerSync={() => syncKey && reconcile(syncKey, true)}
    >
      {activeTab === 'live' ? (
        <LiveStatus 
          users={users} 
          schedule={schedule} 
          onAddUser={(u) => { setUsers([...users, u]); setLastUpdated(Date.now()); }}
          onUpdateUser={(u) => { setUsers(users.map(o => o.id === u.id ? u : o)); setLastUpdated(Date.now()); }}
          onDeleteUser={(id) => { setUsers(users.filter(u => u.id !== id)); setSchedule(schedule.filter(s => s.userId !== id)); setLastUpdated(Date.now()); }}
          onReorderUser={(id, dir) => {
            const idx = users.findIndex(u => u.id === id);
            const target = dir === 'up' ? idx - 1 : idx + 1;
            if (target < 0 || target >= users.length) return;
            const n = [...users];
            [n[idx], n[target]] = [n[target], n[idx]];
            setUsers(n);
            setLastUpdated(Date.now());
          }}
        />
      ) : (
        <WeeklyCalendar 
          users={users} 
          schedule={schedule} 
          onAddEvent={(e) => { setSchedule([...schedule, e]); setLastUpdated(Date.now()); }}
          onAddEvents={(es) => { setSchedule([...schedule, ...es]); setLastUpdated(Date.now()); }}
          onUpdateEvent={(e) => { setSchedule(schedule.map(s => s.id === e.id ? e : s)); setLastUpdated(Date.now()); }}
          onDeleteEvent={(id) => { setSchedule(schedule.filter(s => s.id !== id)); setLastUpdated(Date.now()); }}
        />
      )}

      <GeminiAssistant 
        users={users} 
        schedule={schedule} 
        onAddEvents={(es) => { setSchedule([...schedule, ...es]); setLastUpdated(Date.now()); }} 
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onUpdateProfile={(name, role, photo) => { setProfile({ name, role, photo }); setLastUpdated(Date.now()); }}
        syncKey={syncKey}
        onGenerateKey={() => {
          const key = CloudService.generateSyncKey();
          setSyncKey(key);
          localStorage.setItem(`tf_sync_key_${userEmail}`, key);
        }}
        onJoinTeam={handleJoinTeam}
      />
    </Layout>
  );
};

export default App;
