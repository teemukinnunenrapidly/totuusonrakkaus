import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend";
import crypto from "crypto";

// Create service role client for webhook operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// WooCommerce webhook secret - should match the secret in WooCommerce settings
const WOOCOMMERCE_WEBHOOK_SECRET = process.env.WOOCOMMERCE_WEBHOOK_SECRET || 'sQG?)AJF8CpK9W*33]DK$];%rTnkKz^b7glojt3$eu]OeYOX';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

async function sendPasswordEmail(email: string, firstName: string, password: string) {
  try {
    console.log(`=== SENDING PASSWORD EMAIL ===`);
    console.log(`To: ${email}`);
    console.log(`From: onboarding@resend.dev`);
    console.log(`RESEND_API_KEY exists: ${process.env.RESEND_API_KEY ? 'YES' : 'NO'}`);
    
    const loginUrl = 'https://kurssi.totuusonrakkaus.fi/login';
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Kirjautumistiedot - Totuusonrakkaus',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Totuusonrakkaus</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Kirjautumistiedot</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0;">Hei ${firstName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              Tilillesi on luotu kirjautumistiedot. Tässä ovat tiedot:
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Kirjautumistiedot:</h3>
              <p style="color: #666; margin: 5px 0;"><strong>Sähköposti:</strong> ${email}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Salasana:</strong> ${password}</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Tärkeää:</strong> Säilytä nämä tiedot turvallisesti. 
                Jos unohdat salasanasi, voit palauttaa sen kirjautumissivulla.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Aseta salasana
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">Tietoturva:</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Älä jaa kirjautumistietojasi muiden kanssa</li>
                <li>Kirjaudu ulos julkisilla tietokoneilla</li>
                <li>Jos epäilet tietoturvaongelmia, ota yhteyttä tukeen</li>
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
      `
    });
    
    console.log(`Password email result:`, result);
    console.log(`Password email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending password email:", error);
    throw error;
  }
}

interface WooCommerceOrder {
  id: number;
  order_key: string;
  status: string;
  currency: string;
  total: string;
  customer_id: number;
  billing: {
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: Array<{
    product_id: number;
    name: string;
    sku: string;
    quantity: number;
    total: string;
  }>;
  payment_method_title: string;
  date_created: string;
  date_modified: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== WOOCOMMERCE WEBHOOK DEBUG ===");
    console.log("Environment check:");
    console.log("- NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET");
    console.log("- SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "NOT SET");
    console.log("- RESEND_API_KEY:", process.env.RESEND_API_KEY ? "SET" : "NOT SET");
    console.log("- WOOCOMMERCE_WEBHOOK_SECRET:", WOOCOMMERCE_WEBHOOK_SECRET ? "SET" : "NOT SET");
    
    console.log("WooCommerce webhook received");
    
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const order: WooCommerceOrder = body;

    // Verify webhook signature (temporarily disabled for testing)
    const signature = request.headers.get('x-wc-webhook-signature');
    if (signature) {
      console.log("Webhook signature found, but verification temporarily disabled for testing");
      // const isValid = verifyWebhookSignature(rawBody, signature, WOOCOMMERCE_WEBHOOK_SECRET);
      // if (!isValid) {
      //   console.error("Invalid webhook signature");
      //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      // }
      console.log("Webhook signature verification skipped for testing");
    } else {
      console.log("No webhook signature found, skipping verification");
    }

    console.log(`Order data:`, {
      id: order.id,
      status: order.status,
      customer_email: order.billing.email,
      total: order.total
    });

    // Only process completed orders
    if (order.status !== 'completed') {
      console.log(`Order ${order.id} not completed (status: ${order.status}), skipping`);
      return NextResponse.json({ message: "Order not completed, skipping" });
    }

    console.log(`Processing WooCommerce order: ${order.id}`);

    // Test database connection
    try {
      const { error: testError } = await supabase
        .from('woo_orders')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error("Database connection test failed:", testError);
        return NextResponse.json({ 
          error: "Database connection failed", 
          details: testError.message 
        }, { status: 500 });
      }
      console.log("Database connection test successful");
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json({ 
        error: "Database connection error", 
        details: String(dbError) 
      }, { status: 500 });
    }

    // Check if order already processed
    const { data: existingOrder, error: existingError } = await supabase
      .from('woo_orders')
      .select('id')
      .eq('woo_order_id', order.id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error("Error checking existing order:", existingError);
      return NextResponse.json({ 
        error: "Failed to check existing order", 
        details: existingError.message 
      }, { status: 500 });
    }

    if (existingOrder) {
      console.log(`Order ${order.id} already processed`);
      return NextResponse.json({ message: "Order already processed" });
    }

    // Insert order record
    const { data: wooOrder, error: orderError } = await supabase
      .from('woo_orders')
      .insert({
        woo_order_id: order.id,
        woo_order_key: order.order_key,
        customer_email: order.billing.email,
        customer_first_name: order.billing.first_name,
        customer_last_name: order.billing.last_name,
        order_status: order.status,
        order_total: parseFloat(order.total),
        currency: order.currency,
        payment_method: order.payment_method_title,
        order_date: new Date(order.date_created).toISOString(),
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error inserting order:", orderError);
      return NextResponse.json({ 
        error: "Failed to process order", 
        details: orderError.message 
      }, { status: 500 });
    }

    console.log(`Order ${order.id} inserted successfully`);

    // Process each line item
    for (const item of order.line_items) {
      console.log(`Processing line item: ${item.sku}`);
      
      // Find course mapping for this SKU
      const { data: courseMapping, error: mappingError } = await supabase
        .from('course_sku_mappings')
        .select('course_id, woo_product_name')
        .eq('woo_sku', item.sku)
        .eq('is_active', true)
        .single();

      if (mappingError) {
        console.error(`Error finding course mapping for SKU ${item.sku}:`, mappingError);
        continue;
      }

      if (!courseMapping) {
        console.warn(`No course mapping found for SKU: ${item.sku}`);
        continue;
      }

      console.log(`Found course mapping for SKU ${item.sku}:`, courseMapping);

      // Create or get user
      let userId: string;
      
      // Try to get existing user by email
      const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
      
      if (getUserError) {
        console.error("Error listing users:", getUserError);
        continue;
      }
      
      const existingUser = users?.find(user => user.email === order.billing.email);
      
      if (existingUser) {
        userId = existingUser.id;
        console.log(`Found existing user: ${existingUser.email}`);
      } else {
        console.log(`Creating new user for email: ${order.billing.email}`);
        // Create new user
        const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
          email: order.billing.email,
          password: generatePassword(),
          email_confirm: true,
          user_metadata: {
            full_name: `${order.billing.first_name} ${order.billing.last_name}`.trim(),
            woo_customer_id: order.customer_id
          }
        });

        if (userError) {
          console.error("Error creating user:", userError);
          continue;
        }

        userId = newUser.user.id;
        console.log(`Created new user with ID: ${userId}`);
      }

      // Insert order item
      const { error: itemError } = await supabase
        .from('woo_order_items')
        .insert({
          woo_order_id: wooOrder.id,
          woo_product_id: item.product_id,
          woo_sku: item.sku,
          product_name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.total),
          course_id: courseMapping.course_id,
          user_id: userId,
          enrollment_created_at: new Date().toISOString()
        });

      if (itemError) {
        console.error("Error inserting order item:", itemError);
        continue;
      }

      console.log(`Order item inserted for user ${userId}`);

      // Create or get user account
      let userAccount = null;
      try {
        // Check if user already exists
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === order.billing.email);
        
        if (user) {
          userAccount = user;
          console.log(`Existing user found: ${user.email}`);
        } else {
          // Create new user account
          const password = generatePassword();
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: order.billing.email,
            password: password,
            email_confirm: true,
            user_metadata: {
              first_name: order.billing.first_name,
              last_name: order.billing.last_name || '',
              source: 'woocommerce'
            }
          });

          if (createError) {
            console.error("Error creating user account:", createError);
            continue;
          }

          userAccount = newUser.user;
          console.log(`New user account created: ${userAccount.email}`);

          // Create user profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: userAccount.id,
              role: 'student',
              display_name: `${order.billing.first_name} ${order.billing.last_name || ''}`.trim(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error("Error creating user profile:", profileError);
          }

          // Send password email for new users
          try {
            await sendPasswordEmail(order.billing.email, order.billing.first_name, password);
            console.log(`Password email sent to ${order.billing.email}`);
          } catch (passwordEmailError) {
            console.error("Error sending password email:", passwordEmailError);
          }
        }
      } catch (userError) {
        console.error("Error handling user account:", userError);
        continue;
      }

      // Create enrollment
      const { error: enrollmentError } = await supabase
        .from('student_enrollments')
        .upsert({
          user_id: userAccount.id,
          course_id: courseMapping.course_id,
          woo_order_id: wooOrder.id,
          status: 'active',
          access_granted_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });

      if (enrollmentError) {
        console.error("Error creating enrollment:", enrollmentError);
        continue;
      }

      console.log(`Enrollment created for user ${userAccount.id} in course ${courseMapping.course_id}`);

      // Send welcome email
      try {
        await sendWelcomeEmail(order.billing.email, order.billing.first_name, courseMapping.woo_product_name, userAccount);
        console.log(`Welcome email sent to ${order.billing.email}`);
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }
    }

    console.log("=== WOOCOMMERCE WEBHOOK COMPLETED SUCCESSFULLY ===");
        return NextResponse.json({ 
      success: true,
      message: "Order processed successfully", 
      order_id: order.id 
    }, { status: 200 });

  } catch (error) {
    console.error("=== WOOCOMMERCE WEBHOOK ERROR ===");
    console.error("Error processing WooCommerce webhook:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendWelcomeEmail(email: string, firstName: string, courseName: string, userAccount?: { id: string; email?: string } | null) {
  try {
    console.log(`=== SENDING WELCOME EMAIL ===`);
    console.log(`To: ${email}`);
    console.log(`From: onboarding@resend.dev`);
    console.log(`RESEND_API_KEY exists: ${process.env.RESEND_API_KEY ? 'YES' : 'NO'}`);
    console.log(`Course: ${courseName}`);
    console.log(`User Account:`, userAccount);
    
    const loginUrl = 'https://kurssi.totuusonrakkaus.fi/login';
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `Tervetuloa kurssille: ${courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Totuusonrakkaus</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Tervetuloa kurssille!</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0;">Hei ${firstName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              Kiitos kurssin ostamisesta! Olet nyt kirjautunut kurssille <strong>${courseName}</strong>.
            </p>
            
            <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2e7d32; margin-top: 0;">✅ Kurssi aktivoitu!</h3>
              <p style="color: #2e7d32; margin: 0;">Kurssi on nyt saatavilla tililläsi.</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Kirjautumistiedot:</h3>
              <p style="color: #666; margin: 5px 0;"><strong>Sähköposti:</strong> ${email}</p>
              ${userAccount ? `<p style="color: #666; margin: 5px 0;"><strong>Salasana:</strong> [Salasana lähetetään erikseen]</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Aseta salasana
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #856404; margin: 0 0 10px 0;">📚 Kurssin aloittaminen:</h4>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                <li>Aseta salasana yllä olevalla painikkeella</li>
                <li>Kirjaudu sisään tilillesi</li>
                <li>Siirry "Omat kurssit" -osioon</li>
                <li>Aloita kurssin katselu</li>
              </ul>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">Tuki:</h3>
              <p style="color: #666; margin: 0; line-height: 1.6;">
                Jos kohtaat ongelmia kirjautumisessa tai kurssin käytössä, 
                ota yhteyttä tukeen: <strong>tuki@totuusonrakkaus.fi</strong>
              </p>
            </div>
            
            <p style="color: #999; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              Tämä viesti on lähetetty automaattisesti. Älä vastaa siihen.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2024 Totuusonrakkaus. Kaikki oikeudet pidätetään.</p>
          </div>
        </div>
      `
    });
    
    console.log(`Welcome email result:`, result);
    console.log(`Welcome email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}
