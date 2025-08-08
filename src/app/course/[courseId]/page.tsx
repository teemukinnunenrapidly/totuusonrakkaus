"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCourse, getCourseSections } from "@/lib/database";
import Link from "next/link";
import VimeoEmbed from "@/components/VimeoEmbed";
import CommentSection from "@/components/CommentSection";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Sulje sidebar kun osio valitaan mobiililla
  const handleSectionSelect = (section: CourseSection) => {
    setSelectedSection(section);
    setSidebarOpen(false);
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/my-courses" className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Takaisin kurssit</span>
              </Link>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{course.title}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-gray-500">
                Tervetuloa, {userEmail}
              </div>
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sm:hidden flex items-center gap-2 p-2 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                <span className="text-sm font-medium text-gray-700">Osiot</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Vasen sivupalkki - Osioiden lista */}
          <div className={`lg:w-80 lg:flex-shrink-0 ${
            sidebarOpen 
              ? 'fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto' 
              : 'hidden lg:block'
          }`}>
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            {/* Sidebar content */}
            <div className="relative z-50 lg:relative lg:z-auto h-full lg:h-auto">
              <div className="bg-white shadow-lg p-4 sm:p-6 h-full lg:h-auto overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{course.title}</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-1 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionSelect(section)}
                      className={`w-full text-left p-3 sm:p-4 border-2 transition-all duration-300 shadow-sm hover:shadow-md ${
                        selectedSection?.id === section.id
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-900 shadow-md'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Section number */}
                        <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-semibold ${
                          selectedSection?.id === section.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 leading-tight text-sm sm:text-base">
                            {section.title}
                          </h3>
                          
                          {/* Section metadata */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500">
                            {section.vimeo_url && (
                                                          <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500"></div>
                              Video
                            </span>
                          )}
                          {section.downloadable_materials && section.downloadable_materials.length > 0 && (
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500"></div>
                              Materiaalit
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500"></div>
                            {section.content && section.content.length > 50 ? 'Sisältöä' : 'Lyhyt'}
                          </span>
                          </div>
                        </div>
                        
                        {/* Selection indicator */}
                        {selectedSection?.id === section.id && (
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-blue-600"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Oikea pääsisältö - Valitun osion sisältö */}
          <div className="flex-1 min-w-0">
            {selectedSection ? (
              <div className="bg-white shadow-lg p-4 sm:p-6 lg:p-8">
                {/* Vimeo video */}
                {selectedSection.vimeo_url && (
                  <div className="mb-4 sm:mb-6">
                    <VimeoEmbed 
                      vimeoUrl={selectedSection.vimeo_url}
                      title={selectedSection.title}
                    />
                  </div>
                )}

                {/* Osion otsikko */}
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{selectedSection.title}</h1>

                {/* Osion sisältö */}
                <div className="prose max-w-none mb-6 sm:mb-8 text-sm sm:text-base">
                  <div dangerouslySetInnerHTML={{ __html: selectedSection.content || '' }} />
                </div>

                {/* Ladattavat materiaalit */}
                {selectedSection.downloadable_materials && selectedSection.downloadable_materials.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 sm:pt-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Ladattavat materiaalit</h3>
                    <div className="space-y-2">
                      {selectedSection.downloadable_materials.map((material, index) => (
                        <a
                          key={index}
                          href={material}
                          className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 flex-shrink-0">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7,10 12,15 17,10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          <span className="text-blue-600 hover:text-blue-700 text-sm truncate">
                            {material.split('/').pop() || 'Materiaali'}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kommentit */}
                <div className="border-t border-gray-200 pt-4 sm:pt-6 mt-6 sm:mt-8">
                  <CommentSection courseId={courseId} sectionId={selectedSection.id} />
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-lg p-4 sm:p-6 lg:p-8 text-center">
                <p className="text-gray-500">Valitse osio vasemmalta</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
