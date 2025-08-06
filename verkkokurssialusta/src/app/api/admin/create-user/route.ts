import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, courseAccess, accessUntil, userMetadata } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Sähköposti ja salasana vaaditaan' },
        { status: 400 }
      );
    }

    // Luo käyttäjä Supabase Auth:ssa
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Vahvista sähköposti automaattisesti
      user_metadata: userMetadata || {}
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: `Käyttäjän luonti epäonnistui: ${createError.message}` },
        { status: 400 }
      );
    }

    if (!user.user) {
      return NextResponse.json(
        { error: 'Käyttäjää ei voitu luoda' },
        { status: 500 }
      );
    }

    // Luo profiili user_profiles-tauluun
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.user.id,
        role: role || 'student'
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      
      // Jos profiilin luonti epäonnistui, poista käyttäjä
      await supabase.auth.admin.deleteUser(user.user.id);
      
      return NextResponse.json(
        { error: `Profiilin luonti epäonnistui: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Jos kurssi on valittu, lisää käyttäjä kurssille
    if (courseAccess) {
      const { error: courseError } = await supabase
        .from('user_courses')
        .insert({
          user_id: user.user.id,
          course_id: courseAccess,
          access_until: accessUntil || null,
          status: 'active'
        });

      if (courseError) {
        console.error('Error enrolling user in course:', courseError);
        // Emme poista käyttäjää tässä tapauksessa, koska profiili on jo luotu
      }
    }

    return NextResponse.json(
      { 
        message: 'Käyttäjä luotu onnistuneesti',
        user: {
          id: user.user.id,
          email: user.user.email
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create user API error:', error);
    return NextResponse.json(
      { error: 'Palvelinvirhe käyttäjän luomisessa' },
      { status: 500 }
    );
  }
} 