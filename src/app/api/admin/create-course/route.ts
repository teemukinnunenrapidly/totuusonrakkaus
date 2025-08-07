import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { title, description, price, duration_hours, is_active } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Otsikko ja kuvaus vaaditaan' },
        { status: 400 }
      );
    }

    // Luo kurssi tietokantaan
    const { data: course, error: createError } = await supabase
      .from('courses')
      .insert({
        title,
        description,
        price: price || null,
        duration_hours: duration_hours || null,
        is_active: is_active || false
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating course:', createError);
      return NextResponse.json(
        { error: `Kurssin luonti epäonnistui: ${createError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Kurssi luotu onnistuneesti',
        course: {
          id: course.id,
          title: course.title,
          is_active: course.is_active
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create course API error:', error);
    return NextResponse.json(
      { error: 'Palvelinvirhe kurssin luomisessa' },
      { status: 500 }
    );
  }
} 