"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createUserProfileIfNotExists } from "@/lib/database";
import { 
  BookOpen, 
  ArrowLeft,
  Save,
  EyeOff
} from "lucide-react";
import Link from "next/link";

interface CourseForm {
  title: string;
  description: string;
  price: number | null;
  duration_hours: number | null;
}

export default function LisaaUusiPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<CourseForm>({
    title: '',
    description: '',
    price: null,
    duration_hours: null
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Tarkista nykyinen sessio
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth check error:', error);
          router.push('/login');
          return;
        }

        // Jos ei ole sessiota, ohjaa kirjautumissivulle
        if (!session) {
          router.push('/login');
          return;
        }

        // Luo profiili jos sitä ei ole ja tarkista rooli
        const profile = await createUserProfileIfNotExists(session.user.id, 'student');
        
        if (!profile) {
          console.error('Failed to get/create user profile');
          router.push('/my-courses');
          return;
        }

        // Tarkista onko käyttäjä ylläpitäjä
        if (profile.role !== 'admin') {
          console.log('User is not admin, redirecting to own courses');
          router.push('/my-courses');
          return;
        }

        setUser(session.user);
        setIsAdmin(true);
              } catch (error) {
          console.error('Auth check error:', error);
          router.push('/login');
        } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      alert('Täytä kaikki pakolliset kentät');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/create-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          duration_hours: formData.duration_hours,
          is_active: false // Draft-tila
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kurssin luonti epäonnistui');
      }

      // Näytä success-notifikaatio
      setShowSuccess(true);
      
      // Tyhjennä lomake
      setFormData({
        title: '',
        description: '',
        price: null,
        duration_hours: null
      });
      
      // Ohjaa kaikki-kurssit sivulle 3 sekunnin jälkeen
      setTimeout(() => {
        router.push('/courses');
      }, 3000);
      
    } catch (error) {
      console.error('Error creating course:', error);
      alert(`Virhe kurssin luomisessa: ${error instanceof Error ? error.message : 'Tuntematon virhe'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CourseForm, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/courses"
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
              <h1 className="text-3xl font-bold text-gray-900">Lisää uusi kurssi</h1>
              <p className="text-gray-600">Luo uusi kurssi ja hallitse sen sisältöä</p>
            </div>
          </div>
        </div>

        {/* Success notifikaatio */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                Kurssi luotu onnistuneesti! Ohjataan kaikki-kurssit sivulle...
              </span>
            </div>
          </div>
        )}

        {/* Lomake */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kurssin otsikko */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Kurssin otsikko *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Esimerkki: Totuus on rakkaus - Perusteet"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Kurssin kuvaus */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Kurssin kuvaus *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Kuvaa kurssin sisältöä ja tavoitteita..."
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
              <p className="text-sm text-gray-500 mt-1">Jätä tyhjäksi jos kurssi on ilmainen</p>
            </div>

            {/* Status info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <EyeOff className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Luonnos-tila</h3>
                  <p className="text-sm text-blue-700">
                    Kurssi luodaan luonnos-tilassa. Voit julkaista sen myöhemmin kaikki-kurssit sivulla.
                  </p>
                </div>
              </div>
            </div>

            {/* Painikkeet */}
            <div className="flex gap-4 pt-6">
              <Link
                href="/courses"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-center"
              >
                Peruuta
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Luodaan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Luo kurssi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 