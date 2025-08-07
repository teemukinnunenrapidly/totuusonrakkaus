"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createUserProfileIfNotExists, getAllUsersWithProfiles, getAllUserCourses, getCourses } from "@/lib/database";
import { 
  Users, 
  Trash2, 
  Plus, 
  Calendar,
  BookOpen,
  Mail,
  UserCheck,
  UserX,
  X,
  Phone,
  User,
  CheckCircle
} from "lucide-react";
import type { UserWithProfile, UserCourse, Course } from "@/types/database";

interface AddUserForm {
  name: string;
  phone: string;
  email: string;
  courseId: string;
  accessUntil: string;
}

export default function AsiakkaatPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<AddUserForm>({
    name: '',
    phone: '',
    email: '',
    courseId: '',
    accessUntil: ''
  });
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const initializeSession = async () => {
      // Aseta session storage jos se ei ole vielä asetettu
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !sessionStorage.getItem('supabase.auth.token')) {
        sessionStorage.setItem('supabase.auth.token', 'active');
      }
    };
    
    const checkAuth = async () => {
      if (!isMounted) return;
      
      try {
        setIsLoading(true);
        
        // Tarkista session storage ensin
        const storedAuth = sessionStorage.getItem('supabase.auth.token');
        if (!storedAuth) {
          console.log('No stored auth token');
          router.push('/login');
          return;
        }
        
        // Tarkista sessio ensin ilman timeoutia
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Session error:', error);
          router.push('/login');
          return;
        }

        if (!session) {
          console.log('No session found');
          router.push('/login');
          return;
        }

        // Jos sessio on vanha, yritä uusia token
        if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
          console.log('Session expired, refreshing...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (!isMounted) return;
          
          if (refreshError || !refreshData.session) {
            console.error('Failed to refresh session:', refreshError);
            router.push('/login');
            return;
          }
        }

        // Tarkista käyttäjän rooli
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (!isMounted) return;

        if (profileError || !profile || profile.role !== 'admin') {
          console.log('User is not admin');
          router.push('/my-courses');
          return;
        }

        setUser(session.user);
        setIsAdmin(true);
        
        // Hae kaikki käyttäjät ja kurssit
        await loadData();
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Auth check error:', error);
        
        // Jos on token-ongelma, yritä uusia sessio
        if (error instanceof Error && error.message.includes('JWT')) {
          console.log('JWT error, attempting to refresh session...');
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError && refreshData.session) {
              // Yritä auth-tarkistusta uudelleen
              setTimeout(() => checkAuth(), 1000);
              return;
            }
          } catch (refreshError) {
            console.error('Failed to refresh session:', refreshError);
          }
        }
        
        router.push('/login');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Lisää session listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('supabase.auth.token');
        router.push('/login');
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Päivitä session storage
        if (session) {
          sessionStorage.setItem('supabase.auth.token', 'active');
        }
        
        // Token päivittyi, tarkista admin-oikeudet uudelleen
        if (session) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
            
          if (profile?.role !== 'admin') {
            router.push('/my-courses');
          }
        }
      }
    });

    // Lisää focus event listener
    const handleFocus = () => {
      console.log('Tab became active, rechecking auth...');
      if (isMounted) {
        checkAuth();
      }
    };

    window.addEventListener('focus', handleFocus);

    // Alusta sessio ja tarkista auth
    initializeSession().then(() => checkAuth());
    
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadData = async () => {
    try {
      const [usersData, coursesData, availableCourses] = await Promise.all([
        getAllUsersWithProfiles(),
        getAllUserCourses(),
        getCourses()
      ]);
      
      setUsers(usersData);
      setUserCourses(coursesData);
      setCourses(availableCourses);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Haluatko varmasti poistaa tämän käyttäjän?')) {
      return;
    }

    try {
      console.log('Attempting to delete user:', userId);
      
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Käyttäjän poisto epäonnistui');
      }

      console.log('User deleted successfully');
      
      // Päivitä käyttäjien lista
      await loadData();
      alert('Käyttäjä poistettu onnistuneesti');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Virhe käyttäjän poistossa: ${error instanceof Error ? error.message : 'Tuntematon virhe'}`);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.courseId) {
      alert('Täytä kaikki pakolliset kentät');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: Math.random().toString(36).slice(-8), // Satunnainen salasana
          role: 'student',
          courseAccess: formData.courseId,
          accessUntil: formData.accessUntil || null,
          userMetadata: {
            name: formData.name,
            phone: formData.phone
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Käyttäjän luonti epäonnistui');
      }

      // Päivitä käyttäjien lista
      await loadData();
      
      // Tyhjennä lomake
      setFormData({
        name: '',
        phone: '',
        email: '',
        courseId: '',
        accessUntil: ''
      });

      // Näytä success-notifikaatio
      setShowSuccess(true);
      
      // Sulje modaali 3 sekunnin jälkeen
      setTimeout(() => {
        setShowSuccess(false);
        setShowAddUser(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Virhe käyttäjän luomisessa: ${error instanceof Error ? error.message : 'Tuntematon virhe'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AddUserForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getUserCourses = (userId: string) => {
    return userCourses.filter(uc => uc.user_id === userId);
  };

  const getCourseTitle = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Tuntematon kurssi';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fi-FI');
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
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Asiakkaat</h1>
                <p className="text-gray-600">Hallitse kaikkia rekisteröityneitä käyttäjiä</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus size={20} />
              Lisää käyttäjä
            </button>
          </div>
        </div>

        {/* Käyttäjien taulukko */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Käyttäjä
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rooli
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kurssit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Päättyy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rekisteröitynyt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toiminnot
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const userCoursesList = getUserCourses(user.id);
                  const activeCourses = userCoursesList.filter(uc => uc.status === 'active');
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <Mail className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.profile.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.profile.role === 'admin' ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Ylläpitäjä
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Oppilas
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activeCourses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {activeCourses.map((userCourse) => (
                              <span
                                key={userCourse.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                <BookOpen className="h-3 w-3 mr-1" />
                                {getCourseTitle(userCourse.course_id)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">Ei kursseja</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activeCourses.some(uc => uc.access_until) ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-orange-600" />
                            {formatDate(activeCourses.find(uc => uc.access_until)?.access_until || '')}
                          </div>
                        ) : (
                          <span className="text-gray-500">Ei rajoitusta</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          title="Poista käyttäjä"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lisää käyttäjä - modaali */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Lisää uusi käyttäjä</h2>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Success notifikaatio */}
                {showSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">
                        Käyttäjä lisätty onnistuneesti!
                      </span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAddUser} className="space-y-4">
                  {/* Nimi */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nimi *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Syötä nimi"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Puhelinnumero */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Puhelinnumero
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+358 40 123 4567"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Sähköposti */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Sähköposti *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="esimerkki@email.com"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Kurssi */}
                  <div>
                    <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                      Valitse kurssi *
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <select
                        id="courseId"
                        value={formData.courseId}
                        onChange={(e) => handleInputChange('courseId', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        disabled={isSubmitting}
                      >
                        <option value="">Valitse kurssi</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Päättymispäivä */}
                  <div>
                    <label htmlFor="accessUntil" className="block text-sm font-medium text-gray-700 mb-1">
                      Aseta päättymispäivä
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="date"
                        id="accessUntil"
                        value={formData.accessUntil}
                        onChange={(e) => handleInputChange('accessUntil', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min={new Date().toISOString().split('T')[0]}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Painikkeet */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      disabled={isSubmitting}
                    >
                      Peruuta
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isSubmitting ? 'Lisätään...' : 'Lisää käyttäjä'}
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