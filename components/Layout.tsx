
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
    if (isOffline) return { text: 'Offline', color: 'bg-slate-400', desc: 'Working without internet' };
    
    switch (syncStatus) {
      case 'syncing': return { text: 'Syncing', color: 'bg-yellow-400 animate-pulse', desc: 'Updating cloud...' };
      case 'error': return { text: 'Local Only', color: 'bg-orange-400', desc: 'Sync restricted by network environment. Data safe in browser.' };
      case 'idle': return { text: 'Local Active', color: 'bg-orange-300', desc: 'Changes saved locally' };
      case 'conflict': return { text: 'Version Gap', color: 'bg-orange-600', desc: 'Local and cloud data differ' };
      case 'synced': return { text: `Cloud Live`, color: 'bg-emerald-400', desc: `Synced ${timeAgo}` };
      default: return { text: 'Ready', color: 'bg-indigo-400', desc: 'Session active' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto bg-white shadow-2xl relative">
      <header className="bg-gradient-to-r from-slate-900 to-indigo-900 p-7 text-white shrink-0 flex justify-between items-center relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="bg-white/10 p-1 rounded-2xl backdrop-blur-md border border-white/5 overflow-hidden shadow-2xl">
            {profile?.photo ? (
              <img src={profile.photo} className="w-12 h-12 object-cover rounded-xl" alt="Profile" />
            ) : (
              <div className="p-3"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg></div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-2xl font-black tracking-tight leading-none">{profile?.name || 'TeamFlow'}</h1>
               <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 cursor-pointer hover:bg-white/20 transition-all"
                  title={config.desc}
                  onClick={onTriggerSync}
                >
                  <div className={`w-2 h-2 rounded-full ${config.color}`} />
                  <span>{config.text}</span>
               </div>
            </div>
            <p className="text-indigo-200/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">{profile?.role || 'Team Intelligence Lead'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/5 relative z-10">
          <button onClick={onOpenSettings} className="p-2 hover:bg-white/10 rounded-xl transition-all" title="Settings">
            <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <div className="w-px h-6 bg-white/10"></div>
          <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-xl transition-all" title="Logout">
            <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      <nav className="flex bg-white/80 border-b border-slate-100 sticky top-0 z-40 backdrop-blur-xl">
        <button onClick={() => setActiveTab('live')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'live' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-slate-50/50' : 'text-slate-400 hover:text-indigo-400'}`}>Availability</button>
        <button onClick={() => setActiveTab('calendar')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'calendar' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-slate-50/50' : 'text-slate-400 hover:text-indigo-400'}`}>Team Calendar</button>
      </nav>

      <main className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">{children}</main>

      <footer className="p-5 border-t border-slate-100 bg-white text-[10px] text-slate-400 flex justify-between items-center px-8 uppercase tracking-[0.2em] font-black">
        <span>TeamFlow x Gemini 3 Pro</span>
        <div className="flex items-center gap-2">
          <span className={syncStatus === 'error' ? 'text-orange-500' : 'text-indigo-500 opacity-50'}>
            {syncStatus === 'error' ? 'Environmental Sync Applied' : 'Cloud Connected'}
          </span>
          <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'error' ? 'bg-orange-500' : 'bg-indigo-500 opacity-50'}`}></div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
