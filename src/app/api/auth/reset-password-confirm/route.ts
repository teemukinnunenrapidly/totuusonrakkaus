import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token ja salasana vaaditaan' },
        { status: 400 }
      );
    }

    // Käytetään admin API:a salasanan vaihtoon
    // Access token on JWT, joten dekoodataan se saadaksemme käyttäjän ID:n
    try {
      // Dekoodataan JWT token (yksinkertaistettu versio)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return NextResponse.json(
          { error: 'Virheellinen token muoto' },
          { status: 400 }
        );
      }

      // Dekoodataan payload (base64 decode)
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const userId = payload.sub; // sub on käyttäjän ID JWT:ssä

      if (!userId) {
        return NextResponse.json(
          { error: 'Virheellinen token sisältö' },
          { status: 400 }
        );
      }

      // Vaihda salasana käyttäen admin API:a
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: password }
      );

      if (error) {
        console.error('Password update error:', error);
        return NextResponse.json(
          { error: 'Salasanan vaihto epäonnistui' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          message: 'Salasana vaihdettu onnistuneesti',
          user: data.user 
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Reset password confirm error:', error);
      return NextResponse.json(
        { error: 'Palvelinvirhe salasanan vaihdossa' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Reset password confirm error:', error);
    return NextResponse.json(
      { error: 'Palvelinvirhe salasanan vaihdossa' },
      { status: 500 }
    );
  }
} 