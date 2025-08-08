"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  initializeSessionStorage, 
  getSessionStatus, 
  refreshSessionIfNeeded,
  checkAdminStatus,
  setupAuthStateListener,
  handleFocusEvent
} from "@/lib/sessionManager";
import { getAllUsersWithProfiles, getAllUserCourses, getCourses } from "@/lib/database";
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
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
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
    
    const checkAuth = async () => {
      if (!isMounted) return;
      
      try {
        setIsLoading(true);
        
        // Initialize session storage
        await initializeSessionStorage();
        
        // Get session status
        const sessionStatus = await getSessionStatus();
        
        if (!sessionStatus.isAuthenticated) {
          console.log('Session not authenticated:', sessionStatus.error);
          router.push('/login');
          return;
        }
        
        if (sessionStatus.needsRefresh) {
          console.log('Session needs refresh, refreshing...');
          const refreshedStatus = await refreshSessionIfNeeded();
          
          if (!refreshedStatus.isAuthenticated) {
            console.log('Session refresh failed');
            router.push('/login');
            return;
          }
        }
        
        // Check admin status
        const isAdminUser = await checkAdminStatus(sessionStatus.user?.id as string);
        
        if (!isAdminUser) {
          console.log('User is not admin');
          router.push('/my-courses');
          return;
        }
        
        // Load data
        await loadData();
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Setup auth state listener
    const subscription = setupAuthStateListener((session) => {
      if (!session) {
        console.log('User signed out');
        router.push('/login');
      }
    });

    // Setup focus event listener
    const handleFocus = () => {
      if (isMounted) {
        handleFocusEvent();
      }
    };

    window.addEventListener('focus', handleFocus);

    // Initialize and check auth
    checkAuth();
    
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

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
    
    if (!formData.email || !formData.name) {
      alert('Sähköposti ja nimi vaaditaan');
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
          password: Math.random().toString(36).slice(-8), // Generoi satunnainen salasana
          role: 'student',
          courseAccess: formData.courseId ? [formData.courseId] : [],
          accessUntil: formData.accessUntil || null,
          userMetadata: {
            full_name: formData.name,
            phone: formData.phone
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Käyttäjän luonti epäonnistui');
      }

      const result = await response.json();
      console.log('User created successfully:', result);

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        courseId: '',
        accessUntil: ''
      });

      setShowAddUser(false);
      setShowSuccess(true);

      // Reload data
      await loadData();

      setTimeout(() => setShowSuccess(false), 3000);
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
    return course?.title || 'Tuntematon kurssi';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fi-FI');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ladataan asiakastietoja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Asiakkaat</h1>
              <button
                onClick={() => setShowAddUser(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Lisää käyttäjä
              </button>
            </div>
          </div>

          {showSuccess && (
            <div className="bg-green-50 border border-green-200 px-6 py-4">
              <p className="text-green-800">Käyttäjä lisätty onnistuneesti!</p>
            </div>
          )}

          {showAddUser && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lisää uusi käyttäjä</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nimi *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sähköposti *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puhelin
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kurssi
                    </label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => handleInputChange('courseId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Valitse kurssi</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pääsy päättyy
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.accessUntil}
                      onChange={(e) => handleInputChange('accessUntil', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors duration-200"
                  >
                    {isSubmitting ? 'Lisätään...' : 'Lisää käyttäjä'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors duration-200"
                  >
                    Peruuta
                  </button>
                </div>
              </form>
            </div>
          )}

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
                    Luotu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toiminnot
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userWithProfile) => (
                  <tr key={userWithProfile.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {userWithProfile.user_metadata?.full_name || userWithProfile.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {userWithProfile.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userWithProfile.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {userWithProfile.role === 'admin' ? 'Ylläpitäjä' : 'Oppilas'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getUserCourses(userWithProfile.id).length} kurssia
                      </div>
                      <div className="text-xs text-gray-500">
                        {getUserCourses(userWithProfile.id).map(uc => getCourseTitle(uc.course_id)).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(userWithProfile.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(userWithProfile.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Poista
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 