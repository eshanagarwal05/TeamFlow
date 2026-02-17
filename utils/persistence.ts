
import { createClient } from '@supabase/supabase-js';

// --- Configuration ---
// ideally these are in process.env, but for this demo context we define them here.
// You must replace these with your own Supabase project details.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co'; 
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

// Initialize Supabase Client
// Note: In a real prod app, use a dedicated supabase file, but we keep it here to minimize file sprawl
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Simple cookie management for sessions
 */
export const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const eraseCookie = (name: string) => {
  document.cookie = name + '=; Max-Age=-99999999;path=/';
};

export interface SyncData {
  users: any[];
  schedule: any[];
  lastUpdated: number;
  syncKey: string;
}

export const CloudService = {
  /**
   * Generates a random high-entropy Sync Key
   */
  generateSyncKey: () => {
    return 'TF-' + Math.random().toString(36).substr(2, 6).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  },

  /**
   * Fetches data using the Sync Key from Supabase
   */
  async fetchBySyncKey(syncKey: string): Promise<{ data: SyncData | null, source: 'network' | 'cache' | 'restricted' }> {
    if (!syncKey) return { data: null, source: 'cache' };
    
    try {
      // Fetch from 'teamflow_teams' table
      const { data, error } = await supabase
        .from('teamflow_teams')
        .select('data, updated_at')
        .eq('id', syncKey)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        throw error;
      }

      if (data && data.data) {
        localStorage.setItem(`tf_v15_cache_${syncKey}`, JSON.stringify(data.data));
        return { data: data.data, source: 'network' };
      }

      // If not found in DB, check local cache (offline mode support)
      const localCache = localStorage.getItem(`tf_v15_cache_${syncKey}`);
      if (localCache) {
        return { data: JSON.parse(localCache), source: 'cache' };
      }

      return { data: null, source: 'network' }; // Valid connection, just no data yet
    } catch (e: any) {
      console.error("Supabase Fetch Error:", e);
      // Fallback to cache on error
      const localCache = localStorage.getItem(`tf_v15_cache_${syncKey}`);
      if (localCache) {
        return { data: JSON.parse(localCache), source: 'cache' };
      }
      return { data: null, source: 'restricted' };
    }
  },

  /**
   * Pushes data to Supabase using the Sync Key
   */
  async pushBySyncKey(syncKey: string, payload: any): Promise<{ success: boolean; error?: string; isRestricted?: boolean }> {
    if (!navigator.onLine || !syncKey) return { success: false, error: 'Offline or Missing Key' };
    
    const finalData: SyncData = {
      ...payload,
      syncKey,
      lastUpdated: Date.now()
    };

    try {
      // Upsert into 'teamflow_teams' table
      const { error } = await supabase
        .from('teamflow_teams')
        .upsert({ 
          id: syncKey, 
          data: finalData,
          updated_at: Date.now()
        }, { onConflict: 'id' });

      if (error) throw error;

      localStorage.setItem(`tf_v15_cache_${syncKey}`, JSON.stringify(finalData));
      return { success: true };

    } catch (e: any) {
      console.error("Supabase Push Error:", e);
      return { success: false, error: e.message || 'Sync Error', isRestricted: true };
    }
  }
};

export const LocalStorageService = {
  save: (email: string, data: any) => {
    localStorage.setItem(`tf_v15_local_${email}`, JSON.stringify({ ...data, ts: Date.now() }));
  },
  load: (email: string) => {
    const data = localStorage.getItem(`tf_v15_local_${email}`);
    return data ? JSON.parse(data) : null;
  }
};
