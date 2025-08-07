import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Hae kaikki käyttäjät
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Käyttäjien hakeminen epäonnistui' },
        { status: 500 }
      );
    }

    // Hae kaikki profiilit
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Profiilien hakeminen epäonnistui' },
        { status: 500 }
      );
    }

    // Yhdistä käyttäjät ja profiilit
    const usersWithProfiles = users.users.map(user => {
      const profile = profiles?.find(p => p.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        profile: profile || {
          id: '',
          user_id: user.id,
          role: 'student',
          created_at: user.created_at,
          updated_at: user.created_at
        }
      };
    });

    return NextResponse.json(
      { users: usersWithProfiles },
      { status: 200 }
    );

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Palvelinvirhe käyttäjien haussa' },
      { status: 500 }
    );
  }
} 