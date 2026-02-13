
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

/**
 * Cloud Sync Service (Version 12.0 - Local First Update)
 * Uses restful-api.dev as a key-value store simulator for Glide Tables.
 */
const CLOUD_API_BASE = 'https://api.restful-api.dev/objects';

const getDeterministicId = (email: string) => {
  let hash = 0;
  const str = email.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `tf-v12-${Math.abs(hash)}`;
};

export interface CloudAccount {
  id: string;
  name: string;
  data: {
    passwordHash: string;
    users: any[];
    schedule: any[];
    profileName?: string;
    profileRole?: string;
    profilePhoto?: string;
    lastUpdated: number;
    email: string;
  };
}

export const CloudService = {
  async safeFetch(url: string, options: RequestInit = {}) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        // Using basic headers to avoid triggering CORS preflight issues on restrictive networks
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });
      clearTimeout(timeoutId);
      return { ok: response.ok, status: response.status, data: await response.json().catch(() => null) };
    } catch (e: any) {
      // TypeError: Failed to fetch is almost always a CORS block or Ad-Blocker
      const isBlocked = e.name === 'TypeError' || e.message?.includes('fetch');
      console.warn("CloudService: Connection issue", e.message);
      return { ok: false, status: 0, isBlocked, error: e.message };
    }
  },

  async fetchAccount(email: string): Promise<{ account: CloudAccount | null, source: 'network' | 'cache' | 'blocked' }> {
    const id = getDeterministicId(email);
    const res = await this.safeFetch(`${CLOUD_API_BASE}/${id}`);
    
    if (res.ok && res.data && res.data.data) {
      localStorage.setItem(`tf_v12_cache_${id}`, JSON.stringify(res.data));
      return { account: res.data, source: 'network' };
    }

    const localCache = localStorage.getItem(`tf_v12_cache_${id}`);
    if (localCache) {
      return { account: JSON.parse(localCache), source: 'cache' };
    }

    return { account: null, source: res.isBlocked ? 'blocked' : 'cache' };
  },

  async pushAccount(email: string, payload: any): Promise<{ success: boolean; remoteData?: CloudAccount; error?: string; isBlocked?: boolean }> {
    if (!navigator.onLine) return { success: false, error: 'Offline' };
    
    const id = getDeterministicId(email);
    const finalPayload = {
      name: `TeamFlow:${email}`,
      data: { ...payload, email, lastUpdated: Date.now() }
    };

    const { account: remote, source } = await this.fetchAccount(email);
    
    if (source === 'blocked') {
        return { success: false, isBlocked: true, error: 'Cloud blocked by browser extension' };
    }

    if (remote && remote.data.lastUpdated > payload.lastUpdated) {
      return { success: false, remoteData: remote, error: 'Conflict' };
    }

    const method = remote ? 'PUT' : 'POST';
    const url = remote ? `${CLOUD_API_BASE}/${id}` : CLOUD_API_BASE;
    const savePayload = remote ? finalPayload : { ...finalPayload, id };

    const res = await this.safeFetch(url, {
      method,
      body: JSON.stringify(savePayload)
    });

    if (res.ok) {
      localStorage.setItem(`tf_v12_cache_${id}`, JSON.stringify(res.data));
      return { success: true };
    }

    return { success: false, error: res.error || 'Server Error', isBlocked: res.isBlocked };
  }
};

export const LocalStorageService = {
  save: (email: string, data: any) => {
    localStorage.setItem(`tf_v12_ui_${email}`, JSON.stringify({ ...data, ts: Date.now() }));
  },
  load: (email: string) => {
    const data = localStorage.getItem(`tf_v12_ui_${email}`);
    return data ? JSON.parse(data) : null;
  }
};
