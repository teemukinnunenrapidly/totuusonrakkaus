"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createUserProfileIfNotExists } from "@/lib/database";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Jos ei ole kirjautunut, ohjaa kirjautumissivulle
          router.push('/kirjaudu');
          return;
        }

        // Luo profiili jos sitä ei ole ja tarkista rooli
        const profile = await createUserProfileIfNotExists(session.user.id, 'student');
        
        if (profile) {
          // Ohjaa roolin mukaan
          if (profile.role === 'admin') {
            router.push('/kaikki-kurssit');
          } else {
            router.push('/omat-kurssit');
          }
        } else {
          // Jos profiilia ei voitu luoda, ohjaa omat-kurssit
          router.push('/omat-kurssit');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/kirjaudu');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Näytä loading-tila kun tarkistetaan kirjautumista
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

  // Tämä ei pitäisi koskaan näkyä, koska ohjaus tapahtuu loading-tilan aikana
  return null;
}
