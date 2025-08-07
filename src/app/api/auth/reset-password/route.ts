import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmail } from '@/lib/resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Sähköpostiosoite on pakollinen' },
        { status: 400 }
      );
    }

    // Tarkista että käyttäjä on olemassa
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    const user = users?.users.find(u => u.email === email);
    
    if (userError || !user) {
      // Emme paljasta että käyttäjää ei ole olemassa (turvallisuussyistä)
      return NextResponse.json(
        { message: 'Jos sähköpostiosoite on rekisteröity, saat palautuslinkin' },
        { status: 200 }
      );
    }

    // Luo salasanan palautuslinkki käyttäen admin API:a
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/aseta-uusi-salasana`,
      },
    });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Salasanan palautuslinkin luominen epäonnistui' },
        { status: 500 }
      );
    }

    // Käytetään Supabase:n oletuslinkkiä, mutta muokataan redirectTo
    const originalLink = data.properties.action_link;
    const modifiedLink = originalLink.replace(
      /redirect_to=([^&]*)/,
      `redirect_to=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/aseta-uusi-salasana`)}`
    );
    
    // Lähetä sähköposti Resendin kautta
    await sendPasswordResetEmail(email, modifiedLink);

    return NextResponse.json(
      { message: 'Salasanan palautuslinkki on lähetetty sähköpostiisi' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Virhe salasanan palautuslinkin lähettämisessä' },
      { status: 500 }
    );
  }
} 