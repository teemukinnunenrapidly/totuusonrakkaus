import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTING RESEND EMAIL ===');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: 'Totuusonrakkaus <onboarding@resend.dev>',
      to: 'teme.kinnunen@gmail.com',
      subject: 'Test Email - Totuusonrakkaus',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Test Email</h1>
          <p>This is a test email to verify Resend is working.</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `
    });
    
    console.log('Email result:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: "Test email sent successfully",
      result: result
    });
    
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { error: "Email test failed", details: String(error) },
      { status: 500 }
    );
  }
}
