"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createUserProfileIfNotExists, getCourses } from "@/lib/database";
import { 
  BookOpen, 
  Clock,
  Users,
  Calendar,
  Play,
  Plus
} from "lucide-react";
import type { Course } from "@/types/database";

export default function KaikkiKurssitPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
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

        // Luo profiili jos sitä ei ole ja tarkista rooli
        const profile = await createUserProfileIfNotExists(session.user.id, 'student');
        
        if (!profile) {
          console.error('Failed to get/create user profile');
          router.push('/omat-kurssit');
          return;
        }

        // Tarkista onko käyttäjä ylläpitäjä
        if (profile.role !== 'admin') {
          console.log('User is not admin, redirecting to own courses');
          router.push('/omat-kurssit');
          return;
        }

        setUser(session.user);
        setIsAdmin(true);
        
        // Hae kaikki kurssit
        await loadCourses();
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/kirjaudu');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI');
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Ilmainen';
    return `${price} €`;
  };

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

  // Jos ei ole käyttäjää tai ylläpitäjää, älä näytä mitään
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <BookOpen className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Kaikki kurssit</h1>
                <p className="text-gray-600">Hallitse kaikkia kursseja ja niiden sisältöä</p>
              </div>
            </div>
            <button
              onClick={() => console.log('Lisää uusi kurssi')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus size={20} />
              Lisää uusi kurssi
            </button>
          </div>
        </div>

        {/* Kurssien grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                {/* Kurssin otsikko */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    course.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {course.is_active ? 'Aktiivinen' : 'Ei aktiivinen'}
                  </span>
                </div>

                {/* Kurssin kuvaus */}
                {course.description && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {course.description}
                  </p>
                )}

                {/* Kurssin tiedot */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{course.duration_hours || 0} tuntia</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Luotu: {formatDate(course.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Hinta: {formatPrice(course.price)}</span>
                  </div>
                </div>

                {/* Toiminnot */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    <Play className="h-4 w-4" />
                    Muokkaa kurssia
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tyhjä tila jos ei kursseja */}
        {courses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ei kursseja vielä</h3>
            <p className="text-gray-600">Kursseja ei ole vielä luotu järjestelmään.</p>
          </div>
        )}
      </div>
    </div>
  );
} 