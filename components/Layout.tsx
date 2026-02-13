
import React, { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'live' | 'calendar';
  setActiveTab: (tab: 'live' | 'calendar') => void;
  userEmail: string | null;
  profile?: { name: string, role: string, photo: string };
  onLogout: () => void;
  onOpenSettings: () => void;
  onTriggerSync: () => void;
  syncStatus: 'synced' | 'syncing' | 'error' | 'idle' | 'conflict';
  isOffline: boolean;
  lastSyncedAt: number;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  userEmail, 
  profile,
  onLogout, 
  onOpenSettings,
  onTriggerSync,
  syncStatus,
  isOffline,
  lastSyncedAt
}) => {
  const [timeAgo, setTimeAgo] = useState('Just now');

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - lastSyncedAt) / 1000);
      if (diff < 10) setTimeAgo('Just now');
      else if (diff < 60) setTimeAgo(`${diff}s ago`);
      else if (diff < 3600) setTimeAgo(`${Math.floor(diff/60)}m ago`);
      else setTimeAgo('More than 1h ago');
    };
    const timer = setInterval(update, 5000);
    update();
    return () => clearInterval(timer);
  }, [lastSyncedAt]);

  const getStatusConfig = () => {
    if (isOffline) return { text: 'Disconnected', color: 'bg-slate-400', desc: 'No internet access detected' };
    
    switch (syncStatus) {
      case 'syncing': return { text: 'Syncing...', color: 'bg-yellow-400 animate-pulse', desc: 'Communicating with cloud...' };
      case 'error': return { text: 'Sync Blocked', color: 'bg-red-500', desc: 'Browser or extension is blocking sync' };
      case 'idle': return { text: 'Local Only', color: 'bg-orange-400', desc: 'Working offline (Changes cached)' };
      case 'conflict': return { text: 'Conflict', color: 'bg-orange-600', desc: 'Data mismatch found' };
      case 'synced': return { text: `Synced`, color: 'bg-emerald-400', desc: `Cloud updated ${timeAgo}` };
      default: return { text: 'Ready', color: 'bg-indigo-400', desc: 'Local session active' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto bg-white shadow-xl">
      <header className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white shrink-0 flex justify-between items-center relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/20 p-1 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden shadow-lg">
            {profile?.photo ? (
              <img src={profile.photo} className="w-10 h-10 object-cover rounded-lg" alt="Profile" />
            ) : (
              <div className="p-2"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg></div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h1 className="text-2xl font-black tracking-tight">{profile?.name || 'TeamFlow'}</h1>
               {syncStatus === 'error' && (
                 <button 
                  onClick={onTriggerSync}
                  className="px-2 py-0.5 bg-red-500 hover:bg-red-400 rounded text-[9px] font-black uppercase tracking-tighter"
                  title="Try bypassing the block"
                 >
                   Retry Sync
                 </button>
               )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider opacity-80">{profile?.role || 'Team Member'}</p>
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full text-[9px] font-bold border border-white/5 cursor-help"
                title={config.desc}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
                <span>{config.text}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-2xl backdrop-blur-sm border border-white/10 relative z-10">
          <button onClick={onOpenSettings} className="p-2 hover:bg-white/20 rounded-lg transition-all" title="Settings"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
          <div className="w-px h-6 bg-white/20"></div>
          <button onClick={onLogout} className="p-2 hover:bg-white/20 rounded-lg transition-all" title="Logout"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
        </div>
      </header>

      <nav className="flex bg-slate-50 border-b border-slate-200 sticky top-0 z-40">
        <button onClick={() => setActiveTab('live')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'live' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-400 hover:text-indigo-600'}`}>Live Status</button>
        <button onClick={() => setActiveTab('calendar')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'calendar' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-400 hover:text-indigo-600'}`}>Team Calendar</button>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">{children}</main>

      <footer className="p-4 border-t border-slate-100 bg-white text-center text-[9px] text-slate-400 shrink-0 flex justify-center items-center gap-3 uppercase tracking-widest font-bold">
        <span>TeamFlow Enterprise</span>
        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
        <span className={syncStatus === 'error' ? 'text-red-400' : 'text-indigo-400'}>
          {syncStatus === 'error' ? 'Connection Blocked (Check AdBlock)' : `Persistence Engine v12.0`}
        </span>
      </footer>
    </div>
  );
};

export default Layout;
