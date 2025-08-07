import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();
    
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email ja uusi salasana vaaditaan' },
        { status: 400 }
      );
    }

    // Hae käyttäjän ID email:in perusteella
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Käyttäjien hakeminen epäonnistui' },
        { status: 500 }
      );
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Käyttäjää ei löytynyt' },
        { status: 404 }
      );
    }

    // Päivitä käyttäjän salasana
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      console.error('Password reset error:', error);
      return NextResponse.json(
        { error: 'Salasanan palautus epäonnistui' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Salasana päivitetty onnistuneesti' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password reset API error:', error);
    return NextResponse.json(
      { error: 'Palvelinvirhe salasanan palautuksessa' },
      { status: 500 }
    );
  }
}
