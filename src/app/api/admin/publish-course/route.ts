import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Kurssin ID vaaditaan' },
        { status: 400 }
      );
    }

    // Päivitä kurssin status julkaistuksi
    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update({ is_active: true })
      .eq('id', courseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error publishing course:', updateError);
      return NextResponse.json(
        { error: `Kurssin julkaisu epäonnistui: ${updateError.message}` },
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
        message: 'Kurssi julkaistu onnistuneesti',
        course: {
          id: course.id,
          title: course.title,
          is_active: course.is_active
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Publish course API error:', error);
    return NextResponse.json(
      { error: 'Palvelinvirhe kurssin julkaisussa' },
      { status: 500 }
    );
  }
} 