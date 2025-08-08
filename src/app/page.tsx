"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("=== ETUSIVU: Tarkistetaan kirjautumistila ===");
        
        // Tarkista nykyinen sessio
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("Session data:", session);
        console.log("Session error:", error);
        console.log("Session exists:", !!session);
        
        if (error) {
          console.error("Auth check error:", error);
          router.push('/login');
          return;
        }

        if (session) {
          console.log("✅ Käyttäjä kirjautunut, ohjataan my-courses sivulle");
          console.log("User ID:", session.user.id);
          console.log("User email:", session.user.email);
          window.location.href = '/my-courses';
        } else {
          console.log("❌ Ei sessiota, ohjataan login-sivulle");
          window.location.href = '/login';
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Näytä loading-tila
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Tarkistetaan kirjautumista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Totuusonrakkaus</h1>
        <p className="text-gray-600">Ladataan...</p>
      </div>
    </div>
  );
}
