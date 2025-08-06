"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BookOpen } from "lucide-react";

export default function OmatKurssitPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Tarkista nykyinen sessio
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth check error:', error);
          router.push('/kirjaudu');
          return;
        }

        // Jos ei ole sessiota, ohjaa kirjautumissivulle
        if (!session) {
          router.push('/kirjaudu');
          return;
        }

        // Jos on sessio, aseta käyttäjä
        setUser(session.user);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/kirjaudu');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
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

  // Jos ei ole käyttäjää, älä näytä mitään (ohjaus tapahtuu loading-tilan aikana)
  if (!user) {
    return null;
  }

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <BookOpen className="text-white" size={24} />
              </div>
              Kurssisi
            </h2>
            <p className="text-gray-600 mt-2">
              Tervetuloa, {user.email}!
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <p className="text-gray-600 text-lg mb-4">
                Tällä hetkellä sinulla ei ole vielä kursseja.
              </p>
              <p className="text-sm text-gray-500">
                Kurssit näkyvät täällä kun olet ilmoittautunut niihin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 