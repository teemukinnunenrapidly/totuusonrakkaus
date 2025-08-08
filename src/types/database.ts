// Tietokantataulukoiden TypeScript-tyypit

export interface UserProfile {
  id: string;
  user_id: string;
  role: 'admin' | 'student';
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  duration_hours: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCourse {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  access_until: string | null;
  status: 'active' | 'expired' | 'cancelled';
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  vimeo_url: string | null;
  downloadable_materials: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CourseVideo {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  video_id: string;
  watched_seconds: number;
  completed: boolean;
  last_watched_at: string;
  updated_at: string;
}

// Yhdistetyt tyypit
export interface CourseWithSections extends Course {
  sections: CourseSection[];
}

export interface CourseSectionWithVideos extends CourseSection {
  videos: CourseVideo[];
}

export interface UserCourseWithDetails extends UserCourse {
  course: Course;
}

export interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
  profile: UserProfile;
  role?: 'admin' | 'student'; // Lisätty role-kenttä suoraan käyttäjälle
}

// Database helper types
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_courses: {
        Row: UserCourse;
        Insert: Omit<UserCourse, 'id'>;
        Update: Partial<Omit<UserCourse, 'id'>>;
      };
      course_sections: {
        Row: CourseSection;
        Insert: Omit<CourseSection, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CourseSection, 'id' | 'created_at' | 'updated_at'>>;
      };
      course_videos: {
        Row: CourseVideo;
        Insert: Omit<CourseVideo, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CourseVideo, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_progress: {
        Row: UserProgress;
        Insert: Omit<UserProgress, 'id' | 'updated_at'>;
        Update: Partial<Omit<UserProgress, 'id' | 'updated_at'>>;
      };
    };
  };
}; 