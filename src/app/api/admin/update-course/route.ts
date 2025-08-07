import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { courseId, title, description, price, duration_hours } = await request.json();

    if (!courseId || !title || !description) {
      return NextResponse.json(
        { error: 'Kurssin ID, otsikko ja kuvaus vaaditaan' },
        { status: 400 }
      );
    }

    // Päivitä kurssi tietokannassa
    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update({
        title,
        description,
        price: price || null,
        duration_hours: duration_hours || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating course:', updateError);
      return NextResponse.json(
        { error: `Kurssin päivitys epäonnistui: ${updateError.message}` },
        { status: 500 }
      );
    }

    if (!course) {
      return NextResponse.json(
        { error: 'Kurssia ei löytynyt' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Kurssi päivitetty onnistuneesti',
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          price: course.price,
          duration_hours: course.duration_hours,
          is_active: course.is_active
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update course API error:', error);
    return NextResponse.json(
      { error: 'Palvelinvirhe kurssin päivityksessä' },
      { status: 500 }
    );
  }
} 