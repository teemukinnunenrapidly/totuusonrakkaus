import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Performance monitoring
  if (typeof window !== 'undefined') {
    // Monitor auth performance
    const originalSignInWithPassword = client.auth.signInWithPassword;
    client.auth.signInWithPassword = async (...args) => {
      const startTime = performance.now();
      try {
        const result = await originalSignInWithPassword.apply(client.auth, args);
        const endTime = performance.now();
        console.log(`Supabase auth kesti ${(endTime - startTime).toFixed(2)}ms`);
        return result;
      } catch (error) {
        const endTime = performance.now();
        console.error(`Supabase auth epäonnistui ${(endTime - startTime).toFixed(2)}ms:`, error);
        throw error;
      }
    };
  }
  
  return client;
}

export const supabase = createClient() 