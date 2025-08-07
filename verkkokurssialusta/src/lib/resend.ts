import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
  try {
    // Testauksen aikana lähetetään vain omaan sähköpostiin
    const testEmail = 'teemu.kinnunen@rapidly.fi';
    const actualEmail = email;
    
    console.log(`Attempting to send password reset email to: ${actualEmail}`);
    console.log(`Test mode: sending to ${testEmail} instead`);
    
    const { data, error } = await resend.emails.send({
      from: 'Totuusonrakkaus <onboarding@resend.dev>',
      to: [testEmail], // Testauksen aikana vain omaan sähköpostiin
      subject: 'Salasanan palautus - Totuusonrakkaus',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Totuusonrakkaus</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Salasanan palautus</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0;">Hei!</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              Olet pyytänyt salasanan palautusta Totuusonrakkaus-tilillesi. 
              Klikkaa alla olevaa painiketta asettaaksesi uuden salasanan.
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Testitila:</strong> Tämä viesti lähetettiin testauksen aikana. 
                Oikea vastaanottaja: ${actualEmail}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Aseta uusi salasana
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">Tärkeää tietoa:</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Linkki on voimassa 1 tunti</li>
                <li>Jos et pyytänyt salasanan palautusta, voit jättää tämän viestin huomiotta</li>
                <li>Jos painike ei toimi, kopioi tämä linkki selaimen osoiteriville: ${resetLink}</li>
              </ul>
            </div>
            
            <p style="color: #999; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              Tämä viesti on lähetetty automaattisesti. Älä vastaa siihen.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2024 Totuusonrakkaus. Kaikki oikeudet pidätetään.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Sähköpostin lähetys epäonnistui');
    }

    console.log('Password reset email sent successfully');
    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}; 