"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCourse, getCourseSections } from "@/lib/database";
import Link from "next/link";
import VimeoEmbed from "@/components/VimeoEmbed";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  duration_hours: number | null;
  is_active: boolean;
}

interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  vimeo_url?: string | null;
  downloadable_materials?: string[] | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export default function CoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const loadCourseData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          window.location.href = '/login';
          return;
        }

        setUserEmail(session.user.email || "");

        // Hae kurssin tiedot
        const courseData = await getCourse(courseId);
        if (!courseData) {
          console.error('Course not found');
          return;
        }
        setCourse(courseData);

        // Hae kurssin osiot
        const sectionsData = await getCourseSections(courseId);
        setSections(sectionsData);

        // Valitse ensimmäinen osio oletuksena
        if (sectionsData.length > 0) {
          setSelectedSection(sectionsData[0]);
        }

      } catch (error) {
        console.error('Error loading course:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ladataan kurssia...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Kurssia ei löytynyt</h1>
          <Link href="/my-courses" className="text-blue-600 hover:text-blue-700">
            ← Takaisin kurssit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/my-courses" className="text-gray-600 hover:text-gray-900">
                ← Takaisin kurssit
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
            </div>
            <div className="text-sm text-gray-500">
              Tervetuloa, {userEmail}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Vasen sivupalkki - Osioiden lista */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{course.title}</h2>
              
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-md ${
                      selectedSection?.id === section.id
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-900 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Section number */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        selectedSection?.id === section.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 leading-tight">
                          {section.title}
                        </h3>
                        
                        {/* Section metadata */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {section.vimeo_url && (
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Video
                            </span>
                          )}
                          {section.downloadable_materials && section.downloadable_materials.length > 0 && (
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Materiaalit
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {section.content && section.content.length > 50 ? 'Sisältöä' : 'Lyhyt'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {selectedSection?.id === section.id && (
                        <div className="flex-shrink-0">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Oikea pääsisältö - Valitun osion sisältö */}
          <div className="flex-1">
            {selectedSection ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                {/* Vimeo video */}
                {selectedSection.vimeo_url && (
                  <div className="mb-6">
                    <VimeoEmbed 
                      vimeoUrl={selectedSection.vimeo_url}
                      title={selectedSection.title}
                    />
                  </div>
                )}

                {/* Osion otsikko */}
                <h1 className="text-2xl font-bold text-gray-900 mb-6">{selectedSection.title}</h1>

                {/* Osion sisältö */}
                <div className="prose max-w-none mb-8">
                  <div dangerouslySetInnerHTML={{ __html: selectedSection.content || '' }} />
                </div>

                {/* Ladattavat materiaalit */}
                {selectedSection.downloadable_materials && selectedSection.downloadable_materials.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ladattavat materiaalit</h3>
                    <div className="space-y-2">
                      {selectedSection.downloadable_materials.map((material, index) => (
                        <a
                          key={index}
                          href={material}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7,10 12,15 17,10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          <span className="text-blue-600 hover:text-blue-700">
                            {material.split('/').pop() || 'Materiaali'}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <p className="text-gray-500">Valitse osio vasemmalta</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
