import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Enrolling all students to test course...');

    // Hae kaikki käyttäjät
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Hae testikurssi
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('title', 'Testikurssi')
      .limit(1);

    if (coursesError || !courses || courses.length === 0) {
      console.error('Test course not found');
      return NextResponse.json(
        { error: 'Test course not found' },
        { status: 404 }
      );
    }

    const testCourse = courses[0];
    console.log('Found test course:', testCourse.id);

    // Ilmoita kaikki oppilaat testikurssille
    const enrollments = [];
    for (const user of users.users) {
      // Tarkista että käyttäjä on student
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile && profile.role === 'student') {
        // Tarkista että käyttäjä ei ole jo ilmoittautunut
        const { data: existingEnrollment } = await supabase
          .from('user_courses')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', testCourse.id)
          .single();

        if (!existingEnrollment) {
          const { data: enrollment, error: enrollmentError } = await supabase
            .from('user_courses')
            .insert({
              user_id: user.id,
              course_id: testCourse.id,
              status: 'active',
              enrolled_at: new Date().toISOString()
            })
            .select()
            .single();

          if (enrollmentError) {
            console.error(`Error enrolling user ${user.id}:`, enrollmentError);
          } else {
            enrollments.push(enrollment);
            console.log(`Enrolled user ${user.email} to test course`);
          }
        } else {
          console.log(`User ${user.email} already enrolled`);
        }
      }
    }

    console.log(`Successfully enrolled ${enrollments.length} students`);

    return NextResponse.json(
      { 
        message: `Successfully enrolled ${enrollments.length} students to test course`,
        enrollments: enrollments.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in enroll-all-students API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
