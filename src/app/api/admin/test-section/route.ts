import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test endpoint received:', body);
    
    return NextResponse.json(
      { 
        message: 'Test endpoint toimii',
        received: body
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Test endpoint virhe' },
      { status: 500 }
    );
  }
} 