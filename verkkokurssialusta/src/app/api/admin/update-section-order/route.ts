import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);
    
    const { courseId, sections } = body;

    if (!courseId || !sections || !Array.isArray(sections)) {
      console.error('Invalid request:', { courseId, sections });
      return NextResponse.json(
        { error: 'Kurssin ID ja osioiden järjestys vaaditaan' },
        { status: 400 }
      );
    }

    console.log('Processing request for courseId:', courseId, 'with sections:', sections);

    // Päivitä jokaisen osion järjestys tietokannassa
    for (const section of sections) {
      console.log('Updating section:', section.id, 'to order_index:', section.order_index);
      
      const { error } = await supabase
        .from('course_sections')
        .update({ order_index: section.order_index })
        .eq('id', section.id)
        .eq('course_id', courseId);

      if (error) {
        console.error('Error updating section order:', error);
        return NextResponse.json(
          { error: `Osion järjestyksen päivitys epäonnistui: ${error.message}` },
          { status: 500 }
        );
      }
    }

    console.log('Successfully updated section order for course:', courseId);

    return NextResponse.json(
      { 
        message: 'Osioiden järjestys päivitetty onnistuneesti',
        sections: sections
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update section order API error:', error);
    return NextResponse.json(
      { error: 'Palvelinvirhe osioiden järjestyksen päivityksessä' },
      { status: 500 }
    );
  }
} 