/**
 * Centralized session management utilities
 */

import { supabase } from './supabase';

// Session storage keys
const SESSION_STORAGE_KEY = 'supabase.auth.token';
const SESSION_TIMESTAMP_KEY = 'supabase.auth.timestamp';

// Session timeout (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

export interface SessionStatus {
  isAuthenticated: boolean;
  isExpired: boolean;
  needsRefresh: boolean;
  user: Record<string, unknown> | null;
  error?: string;
}

/**
 * Initialize session storage with current session
 */
export const initializeSessionStorage = async (): Promise<void> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      clearSessionStorage();
      return;
    }
    
    if (session) {
      setSessionStorage(session as unknown as Record<string, unknown>);
    } else {
      clearSessionStorage();
    }
  } catch (error) {
    console.error('Error initializing session storage:', error);
    clearSessionStorage();
  }
};

/**
 * Set session storage with session data
 */
export const setSessionStorage = (session: Record<string, unknown>): void => {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'active');
    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error setting session storage:', error);
  }
};

/**
 * Clear session storage
 */
export const clearSessionStorage = (): void => {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error clearing session storage:', error);
  }
};

/**
 * Check if session storage is valid
 */
export const isSessionStorageValid = (): boolean => {
  try {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const timestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
    
    if (!token || !timestamp) {
      return false;
    }
    
    const timestampNum = parseInt(timestamp, 10);
    const now = Date.now();
    
    // Check if session storage is older than timeout
    if (now - timestampNum > SESSION_TIMEOUT) {
      clearSessionStorage();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking session storage:', error);
    return false;
  }
};

/**
 * Get current session status
 */
export const getSessionStatus = async (): Promise<SessionStatus> => {
  try {
    // First check session storage
    const hasValidStorage = isSessionStorageValid();
    
    if (!hasValidStorage) {
      return {
        isAuthenticated: false,
        isExpired: true,
        needsRefresh: false,
        user: null,
        error: 'No valid session storage'
      };
    }
    
    // Get current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      clearSessionStorage();
      return {
        isAuthenticated: false,
        isExpired: true,
        needsRefresh: false,
        user: null,
        error: error.message
      };
    }
    
    if (!session) {
      clearSessionStorage();
      return {
        isAuthenticated: false,
        isExpired: true,
        needsRefresh: false,
        user: null,
        error: 'No session found'
      };
    }
    
    // Check if session is expired
    const isExpired = !!(session.expires_at && new Date(session.expires_at * 1000) < new Date());
    
    // Update session storage if session is valid
    if (!isExpired) {
      setSessionStorage(session as unknown as Record<string, unknown>);
    }
    
    return {
      isAuthenticated: true,
      isExpired: isExpired,
      needsRefresh: isExpired,
      user: session.user as unknown as Record<string, unknown>,
      error: isExpired ? 'Session expired' : undefined
    };
  } catch (error) {
    console.error('Error getting session status:', error);
    clearSessionStorage();
    return {
      isAuthenticated: false,
      isExpired: true,
      needsRefresh: false,
      user: null,
      error: 'Session check failed'
    };
  }
};

/**
 * Refresh session if needed
 */
export const refreshSessionIfNeeded = async (): Promise<SessionStatus> => {
  const status = await getSessionStatus();
  
  if (status.needsRefresh) {
    try {
      console.log('Refreshing session...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error('Failed to refresh session:', refreshError);
        clearSessionStorage();
        return {
          isAuthenticated: false,
          isExpired: true,
          needsRefresh: false,
          user: null,
          error: 'Session refresh failed'
        };
      }
      
      // Update session storage with refreshed session
      setSessionStorage(refreshData.session as unknown as Record<string, unknown>);
      
      return {
        isAuthenticated: true,
        isExpired: false,
        needsRefresh: false,
        user: refreshData.session.user as unknown as Record<string, unknown>
      };
    } catch (error) {
      console.error('Error refreshing session:', error);
      clearSessionStorage();
      return {
        isAuthenticated: false,
        isExpired: true,
        needsRefresh: false,
        user: null,
        error: 'Session refresh failed'
      };
    }
  }
  
  return status;
};

/**
 * Check if user is admin
 */
export const checkAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (error || !profile) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return profile.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Setup auth state change listener
 */
export const setupAuthStateListener = (onAuthChange?: (session: Record<string, unknown> | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.email);
    
    if (event === 'SIGNED_OUT') {
      clearSessionStorage();
      if (onAuthChange) onAuthChange(null);
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session) {
        setSessionStorage(session as unknown as Record<string, unknown>);
        if (onAuthChange) onAuthChange(session as unknown as Record<string, unknown>);
      }
    }
  });
  
  return subscription;
};

/**
 * Handle focus event for session recheck
 */
export const handleFocusEvent = async (): Promise<void> => {
  console.log('Tab became active, rechecking auth...');
  
  // Check if session storage is still valid
  if (!isSessionStorageValid()) {
    console.log('Session storage invalid, clearing...');
    clearSessionStorage();
    return;
  }
  
  // Refresh session if needed
  const status = await refreshSessionIfNeeded();
  
  if (!status.isAuthenticated) {
    console.log('Session not authenticated after focus check');
    clearSessionStorage();
  }
};
