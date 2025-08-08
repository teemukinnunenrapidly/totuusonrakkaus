import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  checkRateLimit, 
  validateRequest, 
  checkAdminAuth, 
  logSecurityEvent,
  SECURITY_CONFIG 
} from '@/lib/security';

// CORS konfiguraatio
const allowedOrigins = [
  'http://localhost:3000',
  'https://totuusonrakkaus.fi',
  'https://www.totuusonrakkaus.fi'
];

// Input validation regex patterns
const VALID_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

  // 1. Request validation
  const requestValidation = validateRequest(request);
  if (!requestValidation.isValid) {
    logSecurityEvent('suspicious_request', {
      pathname,
      clientIP,
      errors: requestValidation.errors
    }, 'medium');
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Pyyntö estetty tietoturvasyistä',
        details: requestValidation.errors
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 2. Rate limiting
  const isAuthEndpoint = pathname.startsWith('/api/auth') || pathname === '/login';
  const maxRequests = isAuthEndpoint 
    ? SECURITY_CONFIG.RATE_LIMIT_MAX_AUTH_REQUESTS 
    : SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS;
  
  const rateLimitKey = `${clientIP}:${pathname}`;
  const rateLimitResult = checkRateLimit(rateLimitKey, maxRequests);
  
  if (!rateLimitResult.allowed) {
    logSecurityEvent('rate_limit_exceeded', {
      pathname,
      clientIP,
      retryAfter: rateLimitResult.retryAfter
    }, 'medium');
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Liian monta pyyntöä. Yritä uudelleen myöhemmin.',
        retryAfter: rateLimitResult.retryAfter
      }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + rateLimitResult.retryAfter * 1000).toISOString()
        }
      }
    );
  }

  // 3. CORS headers
  const response = NextResponse.next();
  
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');

  // 4. Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 5. Request validation for API endpoints
  if (pathname.startsWith('/api/')) {
    // Validoi UUID-parametrit
    const urlParams = pathname.match(/\/api\/[^\/]+\/([^\/]+)/);
    if (urlParams && urlParams[1] && !VALID_UUID_REGEX.test(urlParams[1])) {
      logSecurityEvent('invalid_uuid_parameter', {
        pathname,
        clientIP,
        invalidParam: urlParams[1]
      }, 'low');
      
      return new NextResponse(
        JSON.stringify({ error: 'Virheellinen ID-parametri' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // 6. Admin endpoint suojaus
  if (pathname.startsWith('/api/admin/')) {
    const adminAuth = await checkAdminAuth(request);
    
    if (!adminAuth.isAdmin) {
      logSecurityEvent('unauthorized_admin_access', {
        pathname,
        clientIP,
        userAgent: request.headers.get('user-agent')
      }, 'high');
      
      return new NextResponse(
        JSON.stringify({ error: 'Admin-endpointit vaativat autentikaation' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // 7. OPTIONS request handling
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200 });
  }

  // 8. Log successful requests for monitoring
  if (pathname.startsWith('/api/')) {
    logSecurityEvent('api_request', {
      pathname,
      method: request.method,
      clientIP,
      userAgent: request.headers.get('user-agent')
    }, 'low');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
