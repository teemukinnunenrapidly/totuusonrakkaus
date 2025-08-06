"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createUserProfileIfNotExists, getCourse, getCourseSections } from "@/lib/database";
import { 
  BookOpen, 
  ArrowLeft,
  Save,
  Plus,
  Edit,
  Trash2,
  Video,
  FileText,
  Eye,
  GripVertical
} from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import type { Course, CourseSection } from "@/types/database";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// SortableSection komponentti
interface SortableSectionProps {
  section: CourseSection;
  onEdit: (section: CourseSection) => void;
}

const SortableSection = ({ section, onEdit }: SortableSectionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <h3 className="font-medium text-gray-900 text-xl">{section.title}</h3>
        </div>
        <button 
          onClick={() => onEdit(section)}
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-2 rounded hover:bg-blue-50"
        >
          <Edit className="h-5 w-5" />
        </button>
      </div>
      
      <div className="text-gray-600 mb-4">
        <p className="line-clamp-4">
          {section.content 
            ? (() => {
                // Poista HTML-tagit ja rajaa teksti
                const cleanText = section.content.replace(/<[^>]*>/g, '').trim();
                return cleanText.length > 300 
                  ? `${cleanText.substring(0, 300)}...` 
                  : cleanText;
              })()
            : 'Ei sisältöä'
          }
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
        {section.updated_at && (
          <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
            <span>Päivitetty:</span>
            <span>{new Date(section.updated_at).toLocaleDateString('fi-FI', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </span>
        )}
        {section.vimeo_url && (
          <span className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
            <Video className="h-4 w-4" />
            <span>Video</span>
          </span>
        )}
        {section.downloadable_materials && section.downloadable_materials.length > 0 && (
          <span className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
            <FileText className="h-4 w-4" />
            <span>{section.downloadable_materials.length} tiedosto</span>
          </span>
        )}
      </div>
    </div>
  );
};

interface CourseForm {
  title: string;
  description: string;
  price: number | null;
  duration_hours: number | null;
}

interface SectionForm {
  title: string;
  content: string;
  vimeo_url: string;
  downloadable_materials: string[];
}

export default function EditPage() {
  console.log('🚀 EditPage komponentti alkaa');
  
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [showEditSection, setShowEditSection] = useState(false);
  const [editingSection, setEditingSection] = useState<CourseSection | null>(null);
  const [isSubmittingSection, setIsSubmittingSection] = useState(false);
  const [formData, setFormData] = useState<CourseForm>({
    title: '',
    description: '',
    price: null,
    duration_hours: null
  });
  const [sectionForm, setSectionForm] = useState<SectionForm>({
    title: '',
    content: '',
    vimeo_url: '',
    downloadable_materials: []
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  console.log('🚀 courseId:', courseId);

  // YKSINKERTAINEN TESTI: Aseta loading false heti
  useEffect(() => {
    console.log('🚀 YKSINKERTAINEN TESTI: Asetetaan loading false');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 checkAuth alkaa, courseId:', courseId);
      try {
        // Tarkista nykyinen sessio
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 Session tarkistettu:', !!session);
        
        if (error) {
          console.error('Auth check error:', error);
          router.push('/kirjaudu');
          return;
        }

        // Jos ei ole sessiota, ohjaa kirjautumissivulle
        if (!session) {
          console.log('🔍 Ei sessiota, ohjataan kirjautumissivulle');
          router.push('/kirjaudu');
          return;
        }

        // Luo profiili jos sitä ei ole ja tarkista rooli
        console.log('🔍 Luodaan/haetaan profiili...');
        const profile = await createUserProfileIfNotExists(session.user.id, 'student');
        console.log('🔍 Profiili:', profile?.role);
        
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

        console.log('🔍 Käyttäjä on admin, asetetaan tiedot');
        setUser(session.user);
        setIsAdmin(true);

        // Jos courseId on annettu, hae kurssi ja osiot
        if (courseId) {
          console.log('🔍 CourseId löytyi, ladataan kurssidataa...');
          await loadCourseData();
        } else {
          console.log('🔍 Ei courseId:tä, asetetaan loading false');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/kirjaudu');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, courseId]);

  const loadCourseData = async () => {
    console.log('🔍 loadCourseData alkaa, courseId:', courseId);
    if (!courseId) {
      console.log('🔍 Ei courseId:tä, asetetaan loading false');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Haetaan kurssi ja osiot...');
      const [courseData, sectionsData] = await Promise.all([
        getCourse(courseId),
        getCourseSections(courseId)
      ]);

      console.log('🔍 Kurssidata haettu:', !!courseData, 'Osioita:', sectionsData.length);

      if (courseData) {
        setCourse(courseData);
        setFormData({
          title: courseData.title,
          description: courseData.description || '',
          price: courseData.price,
          duration_hours: courseData.duration_hours
        });
      }

      setSections(sectionsData);
      console.log('🔍 Data asetettu, asetetaan loading false');
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      console.log('🔍 loadCourseData finally, asetetaan loading false');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId || !formData.title || !formData.description) {
      alert('Täytä kaikki pakolliset kentät');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/update-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          title: formData.title,
          description: formData.description,
          price: formData.price,
          duration_hours: formData.duration_hours
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kurssin päivitys epäonnistui');
      }

      // Päivitä kurssin tiedot
      await loadCourseData();
      
      // Näytä success-notifikaatio
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error updating course:', error);
      alert(`Virhe kurssin päivityksessä: ${error instanceof Error ? error.message : 'Tuntematon virhe'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId || !sectionForm.title || !sectionForm.content) {
      alert('Täytä kaikki pakolliset kentät');
      return;
    }

    setIsSubmittingSection(true);

    try {
      const response = await fetch('/api/admin/create-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          title: sectionForm.title,
          content: sectionForm.content,
          vimeo_url: sectionForm.vimeo_url,
          downloadable_materials: sectionForm.downloadable_materials
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Osion luonti epäonnistui');
      }

      // Päivitä osiot
      await loadCourseData();
      
      // Tyhjennä lomake ja sulje modaali
      setSectionForm({
        title: '',
        content: '',
        vimeo_url: '',
        downloadable_materials: []
      });
      setShowAddSection(false);
      
      // Näytä success-notifikaatio modaalissa
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error creating section:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Tuntematon virhe');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setIsSubmittingSection(false);
    }
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSection || !sectionForm.title || !sectionForm.content) {
      alert('Täytä kaikki pakolliset kentät');
      return;
    }

    setIsSubmittingSection(true);

    // Timeout jos jää jumiin
    const timeoutId = setTimeout(() => {
      console.log('Update section timeout - forcing reset');
      setIsSubmittingSection(false);
      setShowEditSection(false);
      setEditingSection(null);
    }, 10000); // 10 sekuntia

    try {
      console.log('Updating section:', editingSection.id);
      
      // Testataan ensin että API vastaa
      console.log('Testing API connection...');
      const testResponse = await fetch('/api/admin/simple-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          test: 'data',
          sectionId: editingSection.id,
          title: sectionForm.title 
        }),
      });
      
      console.log('Test response status:', testResponse.status);
      if (testResponse.ok) {
        const testResult = await testResponse.json();
        console.log('Test response:', testResult);
      } else {
        console.error('Test failed:', testResponse.status);
      }
      
      const requestBody = {
        sectionId: editingSection.id,
        title: sectionForm.title,
        content: sectionForm.content,
        vimeo_url: sectionForm.vimeo_url,
        downloadable_materials: sectionForm.downloadable_materials
      };
      
      console.log('Sending update request:', {
        sectionId: requestBody.sectionId,
        title: requestBody.title?.substring(0, 50) + '...',
        contentLength: requestBody.content?.length,
        contentPreview: requestBody.content?.substring(0, 100) + '...',
        contentType: typeof requestBody.content,
        contentIsString: typeof requestBody.content === 'string'
      });
      
      const response = await fetch('/api/admin/update-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Update section error:', error);
        throw new Error(error.error || 'Osion päivitys epäonnistui');
      }

      const result = await response.json();
      console.log('Update section success:', result);

      // Päivitä osiot
      await loadCourseData();
      
      // Tyhjennä lomake ja sulje modaali
      setSectionForm({
        title: '',
        content: '',
        vimeo_url: '',
        downloadable_materials: []
      });
      setShowEditSection(false);
      setEditingSection(null);
      
      // Näytä success-notifikaatio modaalissa
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error updating section:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Tuntematon virhe');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      clearTimeout(timeoutId);
      setIsSubmittingSection(false);
    }
  };

  const handleInputChange = (field: keyof CourseForm, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSectionInputChange = (field: keyof SectionForm, value: string | string[]) => {
    setSectionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addDownloadableMaterial = () => {
    setSectionForm(prev => ({
      ...prev,
      downloadable_materials: [...prev.downloadable_materials, '']
    }));
  };

  const updateDownloadableMaterial = (index: number, value: string) => {
    setSectionForm(prev => ({
      ...prev,
      downloadable_materials: prev.downloadable_materials.map((item, i) => 
        i === index ? value : item
      )
    }));
  };

  const removeDownloadableMaterial = (index: number) => {
    setSectionForm(prev => ({
      ...prev,
      downloadable_materials: prev.downloadable_materials.filter((_, i) => i !== index)
    }));
  };

  const handleEditSection = (section: CourseSection) => {
    setEditingSection(section);
    setSectionForm({
      title: section.title,
      content: section.content || '',
      vimeo_url: section.vimeo_url || '',
      downloadable_materials: section.downloadable_materials || []
    });
    setShowEditSection(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('Drag end event:', { active: active.id, over: over?.id });

    if (active.id !== over?.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        console.log('Reordering sections:', { oldIndex, newIndex, courseId });

        const newSections = arrayMove(items, oldIndex, newIndex);
        
        // Päivitä järjestys tietokantaan
        updateSectionOrder(newSections);
        
        return newSections;
      });
    }
  };

  const updateSectionOrder = async (newSections: CourseSection[]) => {
    // Väliaikainen ratkaisu: ei päivitetä tietokantaa vielä
    console.log('Section order changed locally:', newSections.map(s => ({ id: s.id, title: s.title })));
    return;
    
    try {
      const requestBody = {
        courseId,
        sections: newSections.map((section, index) => ({
          id: section.id,
          order_index: index
        }))
      };
      
      console.log('Sending update request:', requestBody);
      
      const response = await fetch('/api/admin/update-section-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Error updating section order:', error.error || 'Unknown error');
        // Väliaikainen ratkaisu: ei päivitetä tietokantaa jos virhe
        console.log('Continuing with local state only');
      } else {
        const result = await response.json();
        console.log('Section order updated successfully:', result);
      }
    } catch (error) {
      console.error('Error updating section order:', error);
      // Väliaikainen ratkaisu: ei päivitetä tietokantaa jos virhe
      console.log('Continuing with local state only');
    }
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

  // Jos kurssia ei löydy
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Kurssia ei löytynyt</h3>
          <p className="text-gray-600">Pyydettyä kurssia ei ole olemassa.</p>
          <Link 
            href="/kaikki-kurssit"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Takaisin kurssit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/kaikki-kurssit"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                Takaisin kurssit
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <BookOpen className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Muokkaa kurssia</h1>
              <p className="text-gray-600">Muokkaa kurssin tietoja ja hallitse osioita</p>
            </div>
          </div>
        </div>

        {/* Success notifikaatio */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                Kurssin tiedot päivitetty onnistuneesti!
              </span>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Kurssin tiedot */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Kurssin tiedot</h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kurssin otsikko */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Kurssin otsikko *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Kurssin otsikko"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Kurssin kuvaus */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Kurssin kuvaus *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Kurssin kuvaus"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Kurssin kesto */}
              <div>
                <label htmlFor="duration_hours" className="block text-sm font-medium text-gray-700 mb-2">
                  Kurssin kesto (tuntia)
                </label>
                <input
                  type="number"
                  id="duration_hours"
                  value={formData.duration_hours || ''}
                  onChange={(e) => handleInputChange('duration_hours', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Esimerkki: 10"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>

              {/* Kurssin hinta */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Kurssin hinta (€)
                </label>
                <input
                  type="number"
                  id="price"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Esimerkki: 99"
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>

              {/* Tallenna-painike */}
              <div className="md:col-span-2">
                <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Tallennetaan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Tallenna kurssin tiedot
                  </>
                )}
                </button>
              </div>
            </form>
          </div>

          {/* Osiot */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Kurssin osiot</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Raahaa osioita järjestyksen muuttamiseksi
                </p>
              </div>
              <button
                onClick={() => {
                  // Tyhjennä lomake ennen modaalin avaamista
                  setSectionForm({
                    title: '',
                    content: '',
                    vimeo_url: '',
                    downloadable_materials: []
                  });
                  // Tyhjennä notifikaatiot
                  setShowSuccess(false);
                  setShowError(false);
                  setErrorMessage('');
                  setShowAddSection(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus size={16} />
                Lisää uusi osio
              </button>
            </div>

            {/* Osioiden lista */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map(section => section.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {sections.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Ei osioita vielä. Lisää ensimmäinen osio.</p>
                    </div>
                  ) : (
                    sections.map((section) => (
                      <SortableSection
                        key={section.id}
                        section={section}
                        onEdit={handleEditSection}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Lisää osio - modaali */}
        {showAddSection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Lisää uusi osio</h2>
                  <button
                    onClick={() => setShowAddSection(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                </div>

                {/* Success notifikaatio */}
                {showSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">
                        Osio luotu onnistuneesti!
                      </span>
                    </div>
                  </div>
                )}

                {/* Error notifikaatio */}
                {showError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-red-800 font-medium">
                        Virhe osion luomisessa: {errorMessage}
                      </span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSectionSubmit} className="space-y-4">
                  {/* Osion otsikko */}
                  <div>
                    <label htmlFor="sectionTitle" className="block text-sm font-medium text-gray-700 mb-2">
                      Osion otsikko *
                    </label>
                    <input
                      type="text"
                      id="sectionTitle"
                      value={sectionForm.title}
                      onChange={(e) => handleSectionInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Osion otsikko"
                      required
                      disabled={isSubmittingSection}
                    />
                  </div>

                  {/* Vimeo URL */}
                  <div>
                    <label htmlFor="vimeoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      Vimeo URL
                    </label>
                    <div className="relative">
                      <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="url"
                        id="vimeoUrl"
                        value={sectionForm.vimeo_url}
                        onChange={(e) => handleSectionInputChange('vimeo_url', e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://vimeo.com/123456789"
                        disabled={isSubmittingSection}
                      />
                    </div>
                  </div>

                  {/* Osion sisältö */}
                  <div>
                    <label htmlFor="sectionContent" className="block text-sm font-medium text-gray-700 mb-2">
                      Sisältö *
                    </label>
                    <RichTextEditor
                      value={sectionForm.content}
                      onChange={(value) => handleSectionInputChange('content', value)}
                      placeholder="Osion sisältö..."
                      disabled={isSubmittingSection}
                    />
                  </div>

                  {/* Ladattavat lisämateriaalit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ladattavat lisämateriaalit
                    </label>
                    <div className="space-y-2">
                      {sectionForm.downloadable_materials.map((material, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="relative flex-1">
                            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="url"
                              value={material}
                              onChange={(e) => updateDownloadableMaterial(index, e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="PDF URL"
                              disabled={isSubmittingSection}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDownloadableMaterial(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors duration-200"
                            disabled={isSubmittingSection}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addDownloadableMaterial}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        disabled={isSubmittingSection}
                      >
                        <Plus className="h-4 w-4" />
                        Lisää uusi
                      </button>
                    </div>
                  </div>

                  {/* Painikkeet */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddSection(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      disabled={isSubmittingSection}
                    >
                      Peruuta
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingSection}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isSubmittingSection ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Luodaan...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Tallenna osio
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Muokkaa osio - modaali */}
        {showEditSection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Muokkaa osioa</h2>
                  <button
                    onClick={() => {
                      setShowEditSection(false);
                      setEditingSection(null);
                      setIsSubmittingSection(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    disabled={isSubmittingSection}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                </div>

                {/* Success notifikaatio */}
                {showSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">
                        Osion päivitys onnistui!
                      </span>
                    </div>
                  </div>
                )}

                {/* Error notifikaatio */}
                {showError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-red-800 font-medium">
                        Virhe osion päivityksessä: {errorMessage}
                      </span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleUpdateSection} className="space-y-4">
                  {/* Osion otsikko */}
                  <div>
                    <label htmlFor="editSectionTitle" className="block text-sm font-medium text-gray-700 mb-2">
                      Osion otsikko *
                    </label>
                    <input
                      type="text"
                      id="editSectionTitle"
                      value={sectionForm.title}
                      onChange={(e) => handleSectionInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Osion otsikko"
                      required
                      disabled={isSubmittingSection}
                    />
                  </div>

                  {/* Vimeo URL */}
                  <div>
                    <label htmlFor="editVimeoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      Vimeo URL
                    </label>
                    <div className="relative">
                      <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="url"
                        id="editVimeoUrl"
                        value={sectionForm.vimeo_url}
                        onChange={(e) => handleSectionInputChange('vimeo_url', e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://vimeo.com/123456789"
                        disabled={isSubmittingSection}
                      />
                    </div>
                  </div>

                  {/* Osion sisältö */}
                  <div>
                    <label htmlFor="editSectionContent" className="block text-sm font-medium text-gray-700 mb-2">
                      Sisältö *
                    </label>
                    <RichTextEditor
                      value={sectionForm.content}
                      onChange={(value) => handleSectionInputChange('content', value)}
                      placeholder="Osion sisältö..."
                      disabled={isSubmittingSection}
                    />
                  </div>

                  {/* Ladattavat lisämateriaalit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ladattavat lisämateriaalit
                    </label>
                    <div className="space-y-2">
                      {sectionForm.downloadable_materials.map((material, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="relative flex-1">
                            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="url"
                              value={material}
                              onChange={(e) => updateDownloadableMaterial(index, e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="PDF URL"
                              disabled={isSubmittingSection}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDownloadableMaterial(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors duration-200"
                            disabled={isSubmittingSection}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addDownloadableMaterial}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        disabled={isSubmittingSection}
                      >
                        <Plus className="h-4 w-4" />
                        Lisää uusi
                      </button>
                    </div>
                  </div>

                  {/* Painikkeet */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditSection(false);
                        setEditingSection(null);
                        setIsSubmittingSection(false);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      disabled={isSubmittingSection}
                    >
                      Peruuta
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingSection}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isSubmittingSection ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Päivitetään...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Tallenna muutokset
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 