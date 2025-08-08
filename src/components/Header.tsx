"use client";

import { BookOpen, LogIn, LogOut, Users, ChevronDown, User, Settings, Menu, X } from "lucide-react";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
        setShowMobileMenu(false);
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
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold text-gray-900">
            <div className="p-1.5 sm:p-2 bg-gray-900">
              <BookOpen className="text-white" size={20} />
            </div>
            <span className="hidden sm:inline">Totuusonrakkaus</span>
          </div>
          <div className="animate-pulse bg-gray-200 h-8 w-24"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link 
          href="/" 
          className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold text-gray-900 hover:text-red-800 transition-colors duration-200"
          aria-label="Siirry etusivulle"
        >
          <div className="p-1.5 sm:p-2 bg-gray-900">
            <BookOpen className="text-white" size={20} />
          </div>
          <span className="hidden sm:inline">Totuusonrakkaus</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Navigaatiovälilehdet kirjautuneelle käyttäjälle */}
              <div className="flex items-center gap-2">
                <Link 
                  href={isAdmin ? "/courses" : "/my-courses"}
                  className="px-3 py-2 text-gray-700 hover:text-red-800 font-medium transition-colors duration-200"
                  aria-label={isAdmin ? "Kaikki kurssit" : "Omat kurssit"}
                >
                  {isAdmin ? "Kaikki kurssit" : "Omat kurssit"}
                </Link>
                
                {/* Asiakkaat-välilehti vain ylläpitäjille */}
                {isAdmin && (
                  <Link 
                    href="/customers"
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-red-800 font-medium transition-colors duration-200"
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
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition-all duration-200"
                  aria-label="Käyttäjävalikko"
                >
                  <div className="w-8 h-8 bg-gray-900 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span>{user?.email}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Alasvetovalikko */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg border border-gray-200 py-2 z-50">
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
                className="flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-900 text-white font-semibold transition-all duration-200"
                aria-label="Kirjaudu sisään"
              >
                <LogIn className="w-4 h-4" />
                Kirjaudu sisään
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center gap-2">
          {isAuthenticated && (
            <>
              {/* Mobile user menu button */}
              <div className="relative user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-all duration-200"
                  aria-label="Käyttäjävalikko"
                >
                  <div className="w-8 h-8 bg-gray-900 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Mobile user dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
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

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors duration-200"
                aria-label="Mobiilivalikko"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          )}

          {!isAuthenticated && (
            <Link href="/login">
              <button 
                className="flex items-center gap-2 px-3 py-2 bg-red-800 hover:bg-red-900 text-white font-semibold transition-all duration-200"
                aria-label="Kirjaudu sisään"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Kirjaudu sisään</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && isAuthenticated && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu Content */}
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Valikko</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <Link 
                href={isAdmin ? "/courses" : "/my-courses"}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                <BookOpen className="w-4 h-4" />
                {isAdmin ? "Kaikki kurssit" : "Omat kurssit"}
              </Link>
              
              {isAdmin && (
                <Link 
                  href="/customers"
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Users className="w-4 h-4" />
                  Asiakkaat
                </Link>
              )}
              
              <Link 
                href="/profile"
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                <User className="w-4 h-4" />
                Omat tiedot
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200 w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Kirjaudu ulos
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 