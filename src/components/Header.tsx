"use client";

import { BookOpen, LogIn, LogOut, Users, ChevronDown, User, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createUserProfileIfNotExists } from "@/lib/database";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        
        if (session?.user) {
          setUser(session.user);
          
          // Luo profiili jos sitä ei ole
          const profile = await createUserProfileIfNotExists(session.user.id, 'student');
          
          if (profile) {
            console.log('User profile found/created:', profile);
            setIsAdmin(profile.role === 'admin');
          } else {
            console.error('Failed to get/create user profile');
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error in checkAuthStatus:', error);
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setIsAuthenticated(!!session);
        
        if (session?.user) {
          setUser(session.user);
          
          // Luo profiili jos sitä ei ole
          const profile = await createUserProfileIfNotExists(session.user.id, 'student');
          
          if (profile) {
            console.log('User profile found/created:', profile);
            setIsAdmin(profile.role === 'admin');
          } else {
            console.error('Failed to get/create user profile');
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        setShowUserMenu(false);
        router.push('/login');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Sulje käyttäjävalikko kun klikataan ulkopuolelta
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Näytä loading-tila kun tarkistetaan kirjautumista
  if (isLoading) {
    return (
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <BookOpen className="text-white" size={24} />
            </div>
            <span>Totuusonrakkaus</span>
          </div>
          <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link 
          href="/" 
          className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
          aria-label="Siirry etusivulle"
        >
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
            <BookOpen className="text-white" size={24} />
          </div>
          <span>Totuusonrakkaus</span>
        </Link>
        
        {/* Navigation */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Navigaatiovälilehdet kirjautuneelle käyttäjälle */}
              <div className="flex items-center gap-2">
                <Link 
                  href={isAdmin ? "/courses" : "/my-courses"}
                  className="px-3 py-2 text-gray-700 hover:text-gray-900 font-medium rounded-lg transition-colors duration-200"
                  aria-label={isAdmin ? "Kaikki kurssit" : "Omat kurssit"}
                >
                  {isAdmin ? "Kaikki kurssit" : "Omat kurssit"}
                </Link>
                
                {/* Asiakkaat-välilehti vain ylläpitäjille */}
                {isAdmin && (
                  <Link 
                    href="/customers"
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 font-medium rounded-lg transition-colors duration-200"
                    aria-label="Asiakkaat"
                  >
                    <Users className="w-4 h-4" />
                    Asiakkaat
                  </Link>
                )}
              </div>
              
              {/* Käyttäjän tiedot ja alasvetovalikko */}
              <div className="relative user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-all duration-200"
                  aria-label="Käyttäjävalikko"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:inline">{user?.email}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Alasvetovalikko */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                      <p className="text-xs text-gray-500">{isAdmin ? 'Ylläpitäjä' : 'Oppilas'}</p>
                    </div>
                    
                    <Link 
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Omat tiedot
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Kirjaudu ulos
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Kirjautumattomalle käyttäjälle: kirjautumisnappi
            <Link href="/login">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                aria-label="Kirjaudu sisään"
              >
                <LogIn className="w-4 h-4" />
                Kirjaudu sisään
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
} 