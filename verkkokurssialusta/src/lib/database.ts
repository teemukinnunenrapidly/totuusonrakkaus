import { supabase } from './supabase';
import type { 
  UserProfile, 
  Course, 
  UserCourse, 
  CourseSection, 
  CourseVideo, 
  UserProgress,
  UserWithProfile 
} from '@/types/database';

// Käyttäjäprofiilit
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('Fetching user profile for:', userId);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Jos profiilia ei löydy, palauta null eikä heitä virhettä
      if (error.code === 'PGRST116') {
        console.log('User profile not found for:', userId);
        return null;
      }
      console.error('Error fetching user profile:', error);
      throw error; // Heitä virhe eteenpäin paremman debuggausta varten
    }

    console.log('User profile found:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error in getUserProfile:', error);
    throw error; // Heitä virhe eteenpäin
  }
};

export const createUserProfile = async (userId: string, role: 'admin' | 'student' = 'student'): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ user_id: userId, role })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in createUserProfile:', error);
    return null;
  }
};

// Uusi funktio: Luo profiili jos sitä ei ole
export const createUserProfileIfNotExists = async (userId: string, role: 'admin' | 'student' = 'student'): Promise<UserProfile | null> => {
  try {
    console.log('Checking if user profile exists for:', userId);
    
    // Yritä ensin hakea olemassa oleva profiili
    let profile = await getUserProfile(userId);
    
    // Jos profiilia ei ole, luo se
    if (!profile) {
      console.log('Creating new user profile for:', userId, 'with role:', role);
      profile = await createUserProfile(userId, role);
      
      if (profile) {
        console.log('User profile created successfully:', profile);
      } else {
        console.error('Failed to create user profile for:', userId);
      }
    } else {
      console.log('User profile already exists:', profile);
    }
    
    return profile;
  } catch (error) {
    console.error('Error in createUserProfileIfNotExists:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in updateUserProfile:', error);
    return null;
  }
};

// Kurssit
export const getCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getCourses:', error);
    return [];
  }
};

export const getActiveCourses = async (): Promise<Course[]> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active courses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getActiveCourses:', error);
    return [];
  }
};

export const getCourse = async (courseId: string): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('Error fetching course:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getCourse:', error);
    return null;
  }
};

// Käyttäjien kurssit
export const getUserCourses = async (userId: string): Promise<UserCourse[]> => {
  try {
    const { data, error } = await supabase
      .from('user_courses')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching user courses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getUserCourses:', error);
    return [];
  }
};

export const enrollUserInCourse = async (userId: string, courseId: string, accessUntil?: string): Promise<UserCourse | null> => {
  try {
    const { data, error } = await supabase
      .from('user_courses')
      .insert({ 
        user_id: userId, 
        course_id: courseId,
        access_until: accessUntil 
      })
      .select()
      .single();

    if (error) {
      console.error('Error enrolling user in course:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in enrollUserInCourse:', error);
    return null;
  }
};

export const removeUserFromCourse = async (userId: string, courseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_courses')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error removing user from course:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in removeUserFromCourse:', error);
    return false;
  }
};

// Kurssien osiot
export const getCourseSections = async (courseId: string): Promise<CourseSection[]> => {
  try {
    const { data, error } = await supabase
      .from('course_sections')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching course sections:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getCourseSections:', error);
    return [];
  }
};

// Kurssien videot
export const getSectionVideos = async (sectionId: string): Promise<CourseVideo[]> => {
  try {
    const { data, error } = await supabase
      .from('course_videos')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching section videos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getSectionVideos:', error);
    return [];
  }
};

// Käyttäjien edistyminen
export const getUserProgress = async (userId: string, videoId: string): Promise<UserProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (error) {
      console.error('Error fetching user progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getUserProgress:', error);
    return null;
  }
};

export const updateUserProgress = async (userId: string, videoId: string, progress: Partial<UserProgress>): Promise<UserProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({ 
        user_id: userId, 
        video_id: videoId,
        ...progress,
        last_watched_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in updateUserProgress:', error);
    return null;
  }
};

// Ylläpitäjän funktiot
export const getAllUsersWithProfiles = async (): Promise<UserWithProfile[]> => {
  try {
    console.log('Fetching all users via API...');
    
    const response = await fetch('/api/admin/users');
    
    if (!response.ok) {
      console.error('API response not ok:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('Users fetched via API:', data.users?.length || 0);
    
    return data.users || [];
  } catch (error) {
    console.error('Unexpected error in getAllUsersWithProfiles:', error);
    return [];
  }
};

export const getAllUserCourses = async (): Promise<UserCourse[]> => {
  try {
    const { data, error } = await supabase
      .from('user_courses')
      .select('*')
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching all user courses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getAllUserCourses:', error);
    return [];
  }
}; 