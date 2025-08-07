"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUserCourses, getCourse } from "@/lib/database";
import Link from "next/link";

interface UserCourse {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  access_until?: string | null;
  course?: {
    id: string;
    title: string;
    description: string | null;
    price: number | null;
    duration_hours: number | null;
    is_active: boolean;
  };
}

export default function MyCoursesPage() {
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const checkAuthAndLoadCourses = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          window.location.href = '/login';
          return;
        }

        setUserEmail(session.user.email || "");
        
        // Hae käyttäjän kurssit
        const courses = await getUserCourses(session.user.id);
        setUserCourses(courses);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadCourses();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ladataan kursseja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-8">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open text-white" aria-hidden="true">
                <path d="M12 7v14"></path>
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
              </svg>
            </div>
            <span>Kurssisi</span>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Tervetuloa, {userEmail}!
            </h2>
            <p className="text-gray-600">
              Tällä hetkellä sinulla ei ole vielä kursseja. Kurssit näkyvät täällä kun olet ilmoittautunut niihin.
            </p>
          </div>

          {userCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                  <path d="M12 7v14"></path>
                  <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                </svg>
              </div>
              <p className="text-gray-500">Ei kursseja vielä</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userCourses.map((userCourse) => (
                <Link 
                  key={userCourse.id}
                  href={`/course/${userCourse.course_id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {userCourse.course?.title || 'Nimeämätön kurssi'}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {userCourse.course?.description || 'Ei kuvausta saatavilla'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{userCourse.course?.duration_hours || 0}h</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Aktiivinen
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 