import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Kurssin ID on pakollinen' },
        { status: 400 }
      );
    }

    console.log('Poistetaan kurssi:', courseId);

    // Poista ensin kurssin osiot (foreign key constraint)
    const { error: sectionsError } = await supabase
      .from('course_sections')
      .delete()
      .eq('course_id', courseId);

    if (sectionsError) {
      console.error('Virhe osioiden poistossa:', sectionsError);
      return NextResponse.json(
        { error: 'Virhe osioiden poistossa' },
        { status: 500 }
      );
    }

    // Poista kurssin ilmoittautumiset
    const { error: enrollmentsError } = await supabase
      .from('user_courses')
      .delete()
      .eq('course_id', courseId);

    if (enrollmentsError) {
      console.error('Virhe ilmoittautumisten poistossa:', enrollmentsError);
      return NextResponse.json(
        { error: 'Virhe ilmoittautumisten poistossa' },
        { status: 500 }
      );
    }

    // Poista kurssi
    const { error: courseError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (courseError) {
      console.error('Virhe kurssin poistossa:', courseError);
      return NextResponse.json(
        { error: 'Virhe kurssin poistossa' },
        { status: 500 }
      );
    }

    console.log('Kurssi poistettu onnistuneesti:', courseId);

    return NextResponse.json(
      { message: 'Kurssi poistettu onnistuneesti' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Virhe kurssin poistossa:', error);
    return NextResponse.json(
      { error: 'Virhe kurssin poistossa' },
      { status: 500 }
    );
  }
}
