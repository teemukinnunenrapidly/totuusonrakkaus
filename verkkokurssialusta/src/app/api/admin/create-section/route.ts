import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { courseId, title, content, vimeo_url, downloadable_materials } = await request.json();

    if (!courseId || !title || !content) {
      return NextResponse.json(
        { error: 'Kurssin ID, otsikko ja sisältö vaaditaan' },
        { status: 400 }
      );
    }

    // Hae seuraava order_index
    const { data: existingSections, error: fetchError } = await supabase
      .from('course_sections')
      .select('order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching existing sections:', fetchError);
      return NextResponse.json(
        { error: `Osioiden hakeminen epäonnistui: ${fetchError.message}` },
        { status: 500 }
      );
    }

    const nextOrderIndex = existingSections && existingSections.length > 0 
      ? existingSections[0].order_index + 1 
      : 1;

    // Luo osio tietokannassa
    const { data: section, error: createError } = await supabase
      .from('course_sections')
      .insert({
        course_id: courseId,
        title,
        content,
        vimeo_url: vimeo_url || null,
        downloadable_materials: downloadable_materials || [],
        order_index: nextOrderIndex
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating section:', createError);
      return NextResponse.json(
        { error: `Osion luonti epäonnistui: ${createError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Osio luotu onnistuneesti',
        section: {
          id: section.id,
          title: section.title,
          content: section.content,
          vimeo_url: section.vimeo_url,
          downloadable_materials: section.downloadable_materials,
          order_index: section.order_index
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create section API error:', error);
    return NextResponse.json(
      { error: 'Palvelinvirhe osion luomisessa' },
      { status: 500 }
    );
  }
} 