import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Attempting to delete user:', userId);

    // Poista käyttäjä Supabase Auth:sta
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Auth delete error:', authError);
      return NextResponse.json(
        { error: `Failed to delete user from auth: ${authError.message}` },
        { status: 500 }
      );
    }

    // Poista käyttäjäprofiili tietokannasta
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('Profile delete error:', profileError);
      // Jos profiilin poisto epäonnistuu, se ei ole kriittinen
      console.log('Note: Could not delete user profile, but user was deleted from auth');
    }

    // Poista käyttäjän kurssit
    const { error: coursesError } = await supabase
      .from('user_courses')
      .delete()
      .eq('user_id', userId);

    if (coursesError) {
      console.error('Courses delete error:', coursesError);
      console.log('Note: Could not delete user courses');
    }

    console.log('User deleted successfully:', userId);

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in delete-user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
