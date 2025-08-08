import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeText, validateInputLength, validateUUID } from '@/lib/sanitization';

// Create a client that can access user sessions
const createServerClient = async (request: NextRequest) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Debug: Log all cookies
  console.log("=== COOKIE DEBUG ===");
  request.cookies.getAll().forEach(cookie => {
    console.log(`Cookie: ${cookie.name} = ${cookie.value.substring(0, 50)}...`);
  });

  // Get the session from Authorization header first
  const authHeader = request.headers.get('authorization');
  console.log("Authorization header:", authHeader);
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log("Token found in Authorization header");
    
    // Try to get user from token directly
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        console.log("User found from token:", user.email);
        return supabase;
      }
    } catch (error) {
      console.log("Error getting user from token:", error);
    }
    
    // Fallback to setSession
    supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    });
  } else {
    // Fallback to cookies
    const authCookie = request.cookies.get('sb-access-token')?.value || 
                       request.cookies.get('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/[^a-zA-Z0-9]/g, '') + '-auth-token')?.value;
    const refreshCookie = request.cookies.get('sb-refresh-token')?.value || 
                         request.cookies.get('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/[^a-zA-Z0-9]/g, '') + '-refresh-token')?.value;

    console.log("Auth cookie found:", !!authCookie);
    console.log("Refresh cookie found:", !!refreshCookie);

    if (authCookie) {
      supabase.auth.setSession({
        access_token: authCookie,
        refresh_token: refreshCookie || ''
      });
    }
  }

  return supabase;
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

    // Create admin client for database operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Hae kommentit tietokannasta
    const { data: comments, error } = await adminSupabase
      .from('comments')
      .select('*')
      .eq('course_id', courseId)
      .eq('section_id', sectionId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Virhe kommenttien haussa:", error);
      return NextResponse.json(
        { error: "Virhe kommenttien haussa" },
        { status: 500 }
      );
    }

    // Muotoile kommentit frontend-ystävälliseen muotoon
    const formattedComments = await Promise.all(
      (comments || []).map(async (comment) => {
        // Hae käyttäjän tiedot erikseen
        const { data: userProfile } = await adminSupabase
          .from('user_profiles')
          .select('display_name, role')
          .eq('user_id', comment.user_id)
          .single();

        return {
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          is_edited: comment.updated_at !== comment.created_at,
          user_id: comment.user_id,
          user_email: null,
          user_name: comment.is_anonymous ? "Anonyymi" : 
                     (userProfile?.display_name || "Käyttäjä"),
          is_admin: userProfile?.role === 'admin',
          parent_comment_id: comment.parent_comment_id,
          is_anonymous: comment.is_anonymous
        };
      })
    );

    return NextResponse.json({ comments: formattedComments });
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
    const body = await request.json();
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log("Token found in Authorization header");
      
      // Create a client to verify the token
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      try {
        const { data: { user: tokenUser }, error } = await supabase.auth.getUser(token);
        if (tokenUser && !error) {
          user = tokenUser;
          console.log("User verified from token:", user.email);
        } else {
          console.log("Error verifying token:", error);
        }
      } catch (error) {
        console.log("Error getting user from token:", error);
      }
    }
    
    if (!user) {
      console.log("No valid user found, returning 401");
      return NextResponse.json(
        { error: "Kirjautuminen vaaditaan kommentin lisäämiseen" },
        { status: 401 }
      );
    }
    
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

    // Debug user
    console.log("=== USER DEBUG ===");
    console.log("User exists:", !!user);
    console.log("User ID:", user?.id);
    console.log("User email:", user?.email);



    // Create admin client for database operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Tallenna kommentti tietokantaan
    const { data: newComment, error: insertError } = await adminSupabase
      .from('comments')
      .insert({
        course_id: courseId,
        section_id: sectionId,
        user_id: user.id,
        content: sanitizedContent,
        parent_comment_id: parentCommentId,
        is_anonymous: commentType === "anonymous"
      })
      .select('*')
      .single();

    if (insertError) {
      console.error("Virhe kommentin tallentamisessa:", insertError);
      return NextResponse.json(
        { error: "Virhe kommentin tallentamisessa" },
        { status: 500 }
      );
    }

    // Hae käyttäjän tiedot erikseen
    const { data: userProfile } = await adminSupabase
      .from('user_profiles')
      .select('display_name, role')
      .eq('user_id', newComment.user_id)
      .single();

    // Muotoile vastaus frontend-ystävälliseen muotoon
    const formattedComment = {
      id: newComment.id,
      content: newComment.content,
      created_at: newComment.created_at,
      updated_at: newComment.updated_at,
      is_edited: false,
      user_id: newComment.user_id,
      user_email: user.email,
      user_name: commentType === "anonymous" ? "Anonyymi" : 
                 (userProfile?.display_name || 
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email?.split('@')[0] ||
                  "Käyttäjä"),
      is_admin: userProfile?.role === 'admin',
      parent_comment_id: newComment.parent_comment_id,
      is_anonymous: newComment.is_anonymous
    };

    return NextResponse.json({ comment: formattedComment });
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
    const supabase = await createServerClient(request);
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

    // Tarkista käyttäjän admin-status (tällä hetkellä ei käytetä)
    try {
      await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      // isAdmin = profile?.role === 'admin'; // Not used currently
    } catch (error) {
      console.error('Error checking admin status:', error);
    }

    // Create admin client for database operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Päivitä kommentti tietokannassa
    const { data: updatedComment, error: updateError } = await adminSupabase
      .from('comments')
      .update({
        content: sanitizedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', session.user.id)
      .select('*')
      .single();

    if (updateError) {
      console.error("Virhe kommentin päivityksessä:", updateError);
      return NextResponse.json(
        { error: "Virhe kommentin päivityksessä" },
        { status: 500 }
      );
    }

    // Hae käyttäjän tiedot erikseen
    const { data: userProfile } = await adminSupabase
      .from('user_profiles')
      .select('display_name, role')
      .eq('user_id', updatedComment.user_id)
      .single();

    // Muotoile vastaus
    const formattedComment = {
      id: updatedComment.id,
      content: updatedComment.content,
      created_at: updatedComment.created_at,
      updated_at: updatedComment.updated_at,
      is_edited: updatedComment.updated_at !== updatedComment.created_at,
      user_id: updatedComment.user_id,
      user_email: session.user.email,
      user_name: userProfile?.display_name || 
                 session.user.user_metadata?.full_name ||
                 session.user.user_metadata?.name ||
                 session.user.email?.split('@')[0] ||
                 "Käyttäjä",
      is_admin: userProfile?.role === 'admin',
      parent_comment_id: updatedComment.parent_comment_id,
      is_anonymous: updatedComment.is_anonymous
    };

    return NextResponse.json({ comment: formattedComment });
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
    const supabase = await createServerClient(request);
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

    // Tarkista käyttäjän admin-status (tällä hetkellä ei käytetä)
    try {
      await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      // isAdmin = profile?.role === 'admin'; // Not used currently
    } catch (error) {
      console.error('Error checking admin status:', error);
    }

    // Create admin client for database operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Poista kommentti tietokannasta
    const { error: deleteError } = await adminSupabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error("Virhe kommentin poistossa:", deleteError);
      return NextResponse.json(
        { error: "Virhe kommentin poistossa" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Kommentti poistettu onnistuneesti"
    });
  } catch (error) {
    console.error("Virhe kommentin poistossa:", error);
    return NextResponse.json(
      { error: "Sisäinen virhe" },
      { status: 500 }
    );
  }
}
