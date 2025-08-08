/**
 * General security utilities
 */

import { NextRequest } from 'next/server';

// Security constants
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,
  RATE_LIMIT_MAX_AUTH_REQUESTS: 20,
  
  // Input validation
  MAX_EMAIL_LENGTH: 255,
  MAX_PASSWORD_LENGTH: 128,
  MAX_CONTENT_LENGTH: 10000,
  MAX_TITLE_LENGTH: 200,
  
  // Session security
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_TOKEN_TIMEOUT: 30 * 24 * 60 * 60 * 1000, // 30 days
  
  // Allowed domains for external resources
  ALLOWED_DOMAINS: [
    'vimeo.com',
    'player.vimeo.com',
    'youtube.com',
    'youtu.be',
    'supabase.co',
    'totuusonrakkaus.fi',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ]
};

// Security headers configuration
export const getSecurityHeaders = () => ({
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
});

// Content Security Policy
export const getCSPPolicy = () => {
  const allowedDomains = SECURITY_CONFIG.ALLOWED_DOMAINS.join(' ');
  
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://*.vimeo.com",
    "frame-src 'self' https://player.vimeo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
};

// Request validation
export const validateRequest = (request: NextRequest) => {
  const errors: string[] = [];
  
  // Check for suspicious patterns in URL
  const url = request.nextUrl.toString();
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS
    /javascript:/i, // XSS
    /on\w+\s*=/i, // XSS event handlers
    /union\s+select/i, // SQL injection
    /drop\s+table/i, // SQL injection
    /exec\s*\(/i, // Command injection
  ];
  
  const containsAttackPattern = suspiciousPatterns.some(pattern => pattern.test(url));
  if (containsAttackPattern) {
    errors.push('Pyyntö sisältää epäilyttäviä merkkejä');
  }
  
  // Check User-Agent
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousUserAgents = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i, /perl/i, /ruby/i
  ];
  
  const isSuspiciousUserAgent = suspiciousUserAgents.some(pattern => 
    pattern.test(userAgent) && 
    !userAgent.includes('Mozilla') && 
    !userAgent.includes('Chrome') && 
    !userAgent.includes('Safari')
  );
  
  if (isSuspiciousUserAgent) {
    errors.push('Epäilyttävä User-Agent');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string, 
  maxRequests: number, 
  windowMs: number = SECURITY_CONFIG.RATE_LIMIT_WINDOW
) => {
  const now = Date.now();
  const userData = rateLimitStore.get(identifier);
  
  if (userData && now < userData.resetTime) {
    if (userData.count >= maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.ceil((userData.resetTime - now) / 1000),
        remaining: 0
      };
    }
    userData.count++;
    return {
      allowed: true,
      retryAfter: 0,
      remaining: maxRequests - userData.count
    };
  } else {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return {
      allowed: true,
      retryAfter: 0,
      remaining: maxRequests - 1
    };
  }
};

// Clean up old rate limit entries
export const cleanupRateLimitStore = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

// Admin authentication check
export const checkAdminAuth = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  const apiKey = request.headers.get('x-api-key');
  
  // Check for service role key in headers (for server-to-server calls)
  if (apiKey === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { isAdmin: true, userId: null };
  }
  
  // Check for Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Here you would validate the JWT token
    // For now, we'll assume it's valid if present
    return { isAdmin: true, userId: 'token-user' };
  }
  
  return { isAdmin: false, userId: null };
};

// Log security events
export const logSecurityEvent = (
  event: string, 
  details: Record<string, any>, 
  severity: 'low' | 'medium' | 'high' = 'low'
) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    severity,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    ip: 'client-ip' // Would be extracted from request in real implementation
  };
  
  console.log(`[SECURITY ${severity.toUpperCase()}]`, logEntry);
  
  // In production, send to security monitoring service
  if (severity === 'high') {
    // Send to security monitoring
    console.error('HIGH SECURITY EVENT:', logEntry);
  }
};

// Validate file upload
export const validateFileUpload = (file: File) => {
  const errors: string[] = [];
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('Tiedosto on liian suuri (max 10MB)');
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Tiedostotyyppi ei ole sallittu');
  }
  
  // Check filename for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS
    /javascript:/i, // XSS
    /\.exe$/i, // Executable
    /\.bat$/i, // Batch file
    /\.sh$/i, // Shell script
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    errors.push('Tiedostonimi sisältää epäilyttäviä merkkejä');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate secure random string
export const generateSecureToken = (length: number = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(array[i] % chars.length);
  }
  
  return result;
};

// Hash sensitive data for logging (not for storage)
export const hashSensitiveData = (data: string) => {
  // Simple hash for logging purposes
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
};
