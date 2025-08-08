import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeEmail, validatePasswordStrength, sanitizeText } from '@/lib/sanitization';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Input validation ja sanitization
    const { email, password, role, courseAccess, accessUntil, userMetadata } = body;

    // Email validation
    if (!email) {
      return NextResponse.json(
        { error: 'Sähköposti vaaditaan' },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Virheellinen sähköpostiosoite' },
        { status: 400 }
      );
    }

    // Password validation
    if (!password) {
      return NextResponse.json(
        { error: 'Salasana vaaditaan' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Salasana ei täytä vahvuusvaatimuksia',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Role validation
    const validRoles = ['admin', 'student'];
    const sanitizedRole = validRoles.includes(role) ? role : 'student';

    // Sanitize user metadata
    const sanitizedUserMetadata = userMetadata ? sanitizeText(JSON.stringify(userMetadata)) : {};

    // Luo käyttäjä Supabase Auth:ssa
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: sanitizedEmail,
      password: password,
      email_confirm: true, // Vahvista sähköposti automaattisesti
      user_metadata: sanitizedUserMetadata
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
        role: sanitizedRole
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

    // Jos kurssipääsy on määritelty, lisää se
    if (courseAccess && courseAccess.length > 0) {
      const enrollments = courseAccess.map((courseId: string) => ({
        user_id: user.user.id,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        access_until: accessUntil || null
      }));

      const { error: enrollmentError } = await supabase
        .from('user_courses')
        .insert(enrollments);

      if (enrollmentError) {
        console.error('Error creating course enrollments:', enrollmentError);
        // Ei palauteta virhettä, koska käyttäjä on jo luotu
      }
    }

    return NextResponse.json(
      { 
        message: 'Käyttäjä luotu onnistuneesti',
        user: {
          id: user.user.id,
          email: user.user.email,
          role: sanitizedRole,
          created_at: user.user.created_at
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