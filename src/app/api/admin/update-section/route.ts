import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Update section request received:', { 
      sectionId: body.sectionId, 
      title: body.title?.substring(0, 50) + '...',
      contentLength: body.content?.length,
      contentType: typeof body.content,
      contentIsString: typeof body.content === 'string',
      contentPreview: body.content?.substring(0, 100) + '...'
    });

    const { sectionId, title, content, vimeo_url, downloadable_materials } = body;

    if (!sectionId || !title || !content) {
      console.error('Missing required fields:', { sectionId, title: !!title, content: !!content });
      return NextResponse.json(
        { error: 'Osion ID, otsikko ja sisältö vaaditaan' },
        { status: 400 }
      );
    }

    if (typeof content !== 'string') {
      console.error('Content is not a string:', typeof content);
      return NextResponse.json(
        { error: 'Sisältön pitää olla teksti' },
        { status: 400 }
      );
    }

    console.log('All required fields present, proceeding with update...');

    // Päivitä osio tietokannassa
    console.log('Updating section in database:', sectionId);
    
    try {
      const { data: section, error: updateError } = await supabase
        .from('course_sections')
        .update({
          title,
          content,
          vimeo_url: vimeo_url || null,
          downloadable_materials: downloadable_materials || []
        })
        .eq('id', sectionId)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase error:', updateError);
        return NextResponse.json(
          { error: `Tietokanta virhe: ${updateError.message}` },
          { status: 500 }
        );
      }

      console.log('Section updated successfully:', section?.id);

      if (!section) {
        console.error('No section returned after update');
        return NextResponse.json(
          { error: 'Osiota ei löytynyt päivityksen jälkeen' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          message: 'Osio päivitetty onnistuneesti',
          section: {
            id: section.id,
            title: section.title,
            content: section.content,
            vimeo_url: section.vimeo_url,
            downloadable_materials: section.downloadable_materials
          }
        },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return NextResponse.json(
        { error: `Tietokanta operaatio virhe: ${dbError}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Update section API error:', error);
    return NextResponse.json(
      { error: 'Palvelinvirhe osion päivityksessä' },
      { status: 500 }
    );
  }
} 