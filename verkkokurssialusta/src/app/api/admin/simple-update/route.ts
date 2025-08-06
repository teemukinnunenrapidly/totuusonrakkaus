import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Simple update received:', body);
    
    return NextResponse.json(
      { 
        message: 'Simple update toimii',
        received: body,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Simple update error:', error);
    return NextResponse.json(
      { error: 'Simple update virhe' },
      { status: 500 }
    );
  }
} 