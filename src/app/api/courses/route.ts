import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { error: 'Kurssien hakeminen epäonnistui' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { courses: data || [] },
      { status: 200 }
    );

  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json(
      { error: 'Palvelinvirhe kurssien haussa' },
      { status: 500 }
    );
  }
} 