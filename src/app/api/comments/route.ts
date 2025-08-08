import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeText, validateInputLength, validateUUID } from '@/lib/sanitization';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mock data for development
const mockComments = [
  {
    id: "1",
    course_id: "test-course",
    section_id: "test-section",
    user_id: "user1",
    content: "Tämä on testikommentti",
    parent_comment_id: null,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    is_edited: false,
    user_email: "test@example.com",
    user_name: "Testi Käyttäjä",
    is_admin: false
  },
  {
    id: "2",
    course_id: "test-course",
    section_id: "test-section",
    user_id: "user2",
    content: "Toinen testikommentti",
    parent_comment_id: null,
    created_at: "2024-01-15T11:00:00Z",
    updated_at: "2024-01-15T11:00:00Z",
    is_edited: false,
    user_email: "admin@example.com",
    user_name: "Admin Käyttäjä",
    is_admin: true
  }
];

const getSectionSpecificComments = (courseId: string, sectionId: string) => {
  return mockComments.filter(comment => 
    comment.course_id === courseId && comment.section_id === sectionId
  );
};

// GET - Hae kommentit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const sectionId = searchParams.get("sectionId");

    // Input validation
    if (!courseId || !validateInputLength(courseId, 1, 100)) {
      return NextResponse.json(
        { error: "Virheellinen kurssi ID" },
        { status: 400 }
      );
    }

    if (!sectionId || !validateInputLength(sectionId, 1, 100)) {
      return NextResponse.json(
        { error: "Virheellinen osio ID" },
        { status: 400 }
      );
    }

    // Tarkista käyttäjän sessio
    const { data: { session } } = await supabase.auth.getSession();
    
    // Jos käyttäjä ei ole kirjautunut, palautetaan mock-dataa
    if (!session) {
      console.log("Käyttäjä ei ole kirjautunut, palautetaan mock-kommentteja");
      const mockComments = getSectionSpecificComments(courseId, sectionId);

      return NextResponse.json({ comments: mockComments });
    }

    // Jos käyttäjä on kirjautunut, palautetaan mock-dataa (tietokanta ei ole vielä valmis)
    const mockComments = getSectionSpecificComments(courseId, sectionId);

    return NextResponse.json({ comments: mockComments });
  } catch (error) {
    console.error("Virhe kommenttien haussa:", error);
    return NextResponse.json(
      { error: "Sisäinen virhe" },
      { status: 500 }
    );
  }
}

// POST - Lisää uusi kommentti
export async function POST(request: NextRequest) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const body = await request.json();
    
    // Input validation ja sanitization
    const { courseId, sectionId, content, parentCommentId, commentType } = body;

    if (!courseId || !validateInputLength(courseId, 1, 100)) {
      return NextResponse.json(
        { error: "Virheellinen kurssi ID" },
        { status: 400 }
      );
    }

    if (!sectionId || !validateInputLength(sectionId, 1, 100)) {
      return NextResponse.json(
        { error: "Virheellinen osio ID" },
        { status: 400 }
      );
    }

    if (!content || !validateInputLength(content, 1, 2000)) {
      return NextResponse.json(
        { error: "Kommentin sisältö vaaditaan (max 2000 merkkiä)" },
        { status: 400 }
      );
    }

    // Sanitize content
    const sanitizedContent = sanitizeText(content);
    if (!sanitizedContent.trim()) {
      return NextResponse.json(
        { error: "Kommentin sisältö ei saa olla tyhjä" },
        { status: 400 }
      );
    }

    // Validate parent comment ID if provided
    if (parentCommentId && !validateUUID(parentCommentId)) {
      return NextResponse.json(
        { error: "Virheellinen vanhempi kommentti ID" },
        { status: 400 }
      );
    }

    // Jos käyttäjä ei ole kirjautunut, simuloidaan kommentin lisäys
    if (!session) {
      console.log("Käyttäjä ei ole kirjautunut, simuloidaan kommentin lisäys");
      const newComment = {
        id: Date.now().toString(),
        course_id: courseId,
        section_id: sectionId,
        user_id: "anonymous_user",
        content: sanitizedContent,
        parent_comment_id: parentCommentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_edited: false,
        user_email: commentType === "anonymous" ? null : "anonymous@example.com",
        user_name: commentType === "anonymous" ? "Anonyymi" : "Käyttäjä",
        is_admin: false
      };

      return NextResponse.json({ comment: newComment });
    }

    // Tarkista käyttäjän admin-status tietokannasta
    let isAdmin = false;
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      isAdmin = profile?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      isAdmin = false;
    }

    // Jos käyttäjä on kirjautunut, simuloidaan kommentin lisäys
    const newComment = {
      id: Date.now().toString(),
      course_id: courseId,
      section_id: sectionId,
      user_id: session.user.id,
      content: sanitizedContent,
      parent_comment_id: parentCommentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_edited: false,
      user_email: commentType === "anonymous" ? null : session.user.email,
      user_name: commentType === "anonymous" ? "Anonyymi" : (session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Käyttäjä"),
      is_admin: isAdmin
    };

    return NextResponse.json({ comment: newComment });
  } catch (error) {
    console.error("Virhe kommentin lisäyksessä:", error);
    return NextResponse.json(
      { error: "Sisäinen virhe" },
      { status: 500 }
    );
  }
}

// PUT - Päivitä kommentti
export async function PUT(request: NextRequest) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const body = await request.json();
    
    // Input validation
    const { commentId, content } = body;

    if (!commentId || !validateUUID(commentId)) {
      return NextResponse.json(
        { error: "Virheellinen kommentti ID" },
        { status: 400 }
      );
    }

    if (!content || !validateInputLength(content, 1, 2000)) {
      return NextResponse.json(
        { error: "Kommentin sisältö vaaditaan (max 2000 merkkiä)" },
        { status: 400 }
      );
    }

    // Sanitize content
    const sanitizedContent = sanitizeText(content);
    if (!sanitizedContent.trim()) {
      return NextResponse.json(
        { error: "Kommentin sisältö ei saa olla tyhjä" },
        { status: 400 }
      );
    }

    // Jos käyttäjä ei ole kirjautunut
    if (!session) {
      return NextResponse.json(
        { error: "Kirjautuminen vaaditaan kommentin muokkaamiseen" },
        { status: 401 }
      );
    }

    // Tarkista käyttäjän admin-status
    let isAdmin = false;
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      isAdmin = profile?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      isAdmin = false;
    }

    // Simuloidaan kommentin päivitys
    const updatedComment = {
      id: commentId,
      content: sanitizedContent,
      updated_at: new Date().toISOString(),
      is_edited: true,
      is_admin: isAdmin
    };

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error("Virhe kommentin päivityksessä:", error);
    return NextResponse.json(
      { error: "Sisäinen virhe" },
      { status: 500 }
    );
  }
}

// DELETE - Poista kommentti
export async function DELETE(request: NextRequest) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    // Input validation
    if (!commentId || !validateUUID(commentId)) {
      return NextResponse.json(
        { error: "Virheellinen kommentti ID" },
        { status: 400 }
      );
    }

    // Jos käyttäjä ei ole kirjautunut
    if (!session) {
      return NextResponse.json(
        { error: "Kirjautuminen vaaditaan kommentin poistamiseen" },
        { status: 401 }
      );
    }

    // Tarkista käyttäjän admin-status
    let isAdmin = false;
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      isAdmin = profile?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      isAdmin = false;
    }

    // Simuloidaan kommentin poisto
    return NextResponse.json({ 
      message: "Kommentti poistettu onnistuneesti",
      isAdmin: isAdmin
    });
  } catch (error) {
    console.error("Virhe kommentin poistossa:", error);
    return NextResponse.json(
      { error: "Sisäinen virhe" },
      { status: 500 }
    );
  }
}
