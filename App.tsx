
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

const SESSION_COOKIE = 'tf_session_v11';
const SYNC_HEARTBEAT_MS = 30000;

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
    const handleOnline = () => setIsOffline(false);
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
  }, []);

  /**
   * Reconciliation Logic
   */
  const reconcile = useCallback(async (email: string, force: boolean = false) => {
    if (!email || !navigator.onLine) return;
    
    if (force) setSyncStatus('syncing');

    try {
      const { account: cloud, source } = await CloudService.fetchAccount(email);
      
      if (cloud && cloud.data) {
        // If remote is newer, update local
        if (cloud.data.lastUpdated > lastUpdated) {
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
        
        if (source === 'network') {
            setSyncStatus('synced');
            setLastSyncedAt(Date.now());
        // Fix: Changed 'blocked' to 'restricted' to match CloudService.fetchAccount return types
        } else if (source === 'restricted') {
            setSyncStatus('error');
        } else {
            setSyncStatus('idle');
        }
      } else {
        // Fix: Changed 'blocked' to 'restricted' to match CloudService.fetchAccount return types
        setSyncStatus(source === 'restricted' ? 'error' : 'idle');
      }
    } catch (e) {
      setSyncStatus('error');
    }
  }, [lastUpdated]);

  // Initial Load - Local First
  useEffect(() => {
    const session = getCookie(SESSION_COOKIE);
    if (session) {
      // 1. Load from local cache immediately
      const cached = LocalStorageService.load(session);
      if (cached) {
        setUsers(cached.users || []);
        setSchedule(cached.schedule || []);
        if (cached.profile) setProfile(cached.profile);
        if (cached.passwordHash) setPasswordHash(cached.passwordHash);
        if (cached.ts) setLastUpdated(cached.ts);
        lastSyncHash.current = JSON.stringify({ u: cached.users, s: cached.schedule, p: cached.profile });
      } else {
        // First time user on this device but has session
        setUsers(MOCK_USERS);
        setSchedule(MOCK_SCHEDULE);
        setProfile({ name: session.split('@')[0], role: 'Lead', photo: `https://picsum.photos/seed/${session}/200` });
      }
      
      setUserEmail(session);
      setIsLoaded(true); // Show app UI immediately

      // 2. Try background sync
      reconcile(session, true).finally(() => {
        initialLoadDone.current = true;
      });
    } else {
      setIsLoaded(true);
    }
  }, [reconcile]);

  // Background Heartbeat
  useEffect(() => {
    if (!userEmail || isOffline || syncStatus === 'synced') return;
    const interval = setInterval(() => {
      reconcile(userEmail);
    }, SYNC_HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [userEmail, reconcile, syncStatus, isOffline]);

  /**
   * AUTH HANDLER
   */
  const handleAuth = async (email: string, password: string, isSignUp: boolean) => {
    setAuthError(null);
    setSyncStatus('syncing');

    try {
      const { account: cloud, source } = await CloudService.fetchAccount(email);

      if (isSignUp) {
        const initialProfile = { name: email.split('@')[0], role: 'Team Lead', photo: `https://picsum.photos/seed/${email}/200` };
        const now = Date.now();
        
        // Save locally first
        setCookie(SESSION_COOKIE, email);
        setUserEmail(email);
        setPasswordHash(password);
        setUsers(MOCK_USERS);
        setSchedule(MOCK_SCHEDULE);
        setProfile(initialProfile);
        setLastUpdated(now);
        initialLoadDone.current = true;

        // Try to push to cloud
        const res = await CloudService.pushAccount(email, { 
          users: MOCK_USERS, 
          schedule: MOCK_SCHEDULE,
          profileName: initialProfile.name,
          profileRole: initialProfile.role,
          profilePhoto: initialProfile.photo,
          passwordHash: password,
          lastUpdated: now
        });
        
        // Fix: Property 'isBlocked' does not exist on type, using 'isRestricted' instead
        setSyncStatus(res.success ? 'synced' : res.isRestricted ? 'error' : 'idle');
      } else {
        // Login requires cloud unless we have it cached
        // Fix: Changed 'blocked' to 'restricted' to match CloudService.fetchAccount return types
        if (!cloud && source === 'restricted') {
          setAuthError('Connection blocked. Disable Ad-Blockers to log in for the first time.');
          setSyncStatus('error');
          return;
        }

        if (!cloud) {
          setAuthError('Account not found. Check your internet or sign up.');
          setSyncStatus('idle');
          return;
        }
        
        if (cloud.data.passwordHash !== password) {
          setAuthError('Invalid password.');
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
        setSyncStatus(source === 'network' ? 'synced' : 'idle');
        initialLoadDone.current = true;
      }
    } catch (e) {
      setAuthError('Authentication failed.');
      setSyncStatus('error');
    }
  };

  /**
   * DEBOUNCED PUSH ENGINE
   */
  useEffect(() => {
    if (userEmail && initialLoadDone.current) {
      LocalStorageService.save(userEmail, { users, schedule, profile, passwordHash });
      
      const currentHash = JSON.stringify({ u: users, s: schedule, p: profile });
      if (currentHash === lastSyncHash.current) return;

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      
      syncTimeout.current = window.setTimeout(async () => {
        setSyncStatus('syncing');
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
          // Fix: Property 'isBlocked' does not exist on type, using 'isRestricted' instead
          setSyncStatus(result.isRestricted ? 'error' : 'idle');
        }
      }, 3000);
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
      onTriggerSync={() => reconcile(userEmail, true)}
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
        currentPassword={passwordHash}
        onUpdatePassword={(p) => { setPasswordHash(p); setLastUpdated(Date.now()); }}
      />
    </Layout>
  );
};

export default App;
