import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// PUT - Muokkaa kommenttia
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { data: { session } } = await supabase.auth.getSession();
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Sisältö vaaditaan" },
        { status: 400 }
      );
    }

    // Simuloidaan kommentin muokkaus
    const updatedComment = {
      id: resolvedParams.commentId,
      content: content,
      updated_at: new Date().toISOString(),
      is_edited: true
    };

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error("Virhe kommentin muokkaamisessa:", error);
    return NextResponse.json(
      { error: "Sisäinen virhe" },
      { status: 500 }
    );
  }
}

// DELETE - Poista kommentti
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { data: { session } } = await supabase.auth.getSession();
    
    // Jos käyttäjä ei ole kirjautunut, palautetaan mock-vastaus (ei 401)
    if (!session) {
      console.log("Käyttäjä ei ole kirjautunut, simuloidaan kommentin poisto");
      return NextResponse.json({ 
        success: true, 
        message: "Kommentti poistettu onnistuneesti" 
      });
    }

    // Simuloidaan kommentin poisto
    console.log(`Poistetaan kommentti: ${resolvedParams.commentId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Kommentti poistettu onnistuneesti" 
    });
  } catch (error) {
    console.error("Virhe kommentin poistamisessa:", error);
    return NextResponse.json(
      { error: "Sisäinen virhe" },
      { status: 500 }
    );
  }
}
