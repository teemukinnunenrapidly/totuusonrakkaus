/**
 * Security utilities and configuration
 */

import { NextRequest } from 'next/server';

// Security configuration
export const SECURITY_CONFIG = {
  RATE_LIMIT_MAX_REQUESTS: 100, // Max requests per window
  RATE_LIMIT_MAX_AUTH_REQUESTS: 10, // Stricter limit for auth endpoints
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute window
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

// In-memory rate limit store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Get security headers for responses
 */
export const getSecurityHeaders = () => ({
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
});

/**
 * Get Content Security Policy
 */
export const getCSPPolicy = () => {
  return "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://*.vimeo.com; frame-src 'self' https://player.vimeo.com; object-src 'none'; base-uri 'self'; form-action 'self';";
};

/**
 * Validate incoming request
 */
export const validateRequest = (request: NextRequest) => {
  const errors: string[] = [];
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // Script injection
    /javascript:/i, // JavaScript protocol
    /on\w+\s*=/i, // Event handlers
    /union\s+select/i, // SQL injection
    /drop\s+table/i, // SQL injection
    /exec\s*\(/i, // Command injection
  ];

  const url = request.url;
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent)
  );

  if (hasSuspiciousPattern) {
    errors.push('Suspicious request pattern detected');
  }

  // Check request size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.MAX_REQUEST_SIZE) {
    errors.push('Request too large');
  }

  // Check for suspicious User-Agent
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];

  const hasSuspiciousUserAgent = suspiciousUserAgents.some(pattern => 
    pattern.test(userAgent)
  );

  if (hasSuspiciousUserAgent && !userAgent.includes('Mozilla')) {
    errors.push('Suspicious User-Agent');
  }

  return {
    isValid: errors.length === 0,
    errors,
    clientIP,
    userAgent
  };
};

/**
 * Check rate limit for a given identifier
 */
export const checkRateLimit = (
  identifier: string, 
  maxRequests: number, 
  windowMs: number = SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS
) => {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / windowMs)}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (current.count >= maxRequests) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    };
  }
  
  current.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - current.count 
  };
};

/**
 * Clean up old rate limit entries
 */
export const cleanupRateLimitStore = () => {
  const now = Date.now();
  const windowMs = SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS;
  
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime + windowMs) {
      rateLimitStore.delete(key);
    }
  }
};

/**
 * Check if user is admin
 */
export const checkAdminAuth = async (request: NextRequest) => {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAdmin: false, error: 'No authorization header' };
    }

    const token = authHeader.substring(7);
    
    // In a real implementation, you would verify the JWT token here
    // For now, we'll use a simple check against environment variable
    const adminToken = process.env.ADMIN_SECRET_TOKEN;
    
    if (!adminToken || token !== adminToken) {
      return { isAdmin: false, error: 'Invalid admin token' };
    }
    
    return { isAdmin: true };
  } catch (error) {
    console.error('Admin auth error:', error);
    return { isAdmin: false, error: 'Admin auth failed' };
  }
};

/**
 * Log security events
 */
export const logSecurityEvent = (
  event: string, 
  details: Record<string, unknown>, 
  severity: 'low' | 'medium' | 'high' = 'low'
) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    severity,
    details,
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.log(`[SECURITY] ${severity.toUpperCase()}: ${event}`, logEntry);
  
  // In production, you would send this to a logging service
  // like CloudWatch, Loggly, or similar
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file: File) => {
  const errors: string[] = [];
  
  // Check file size
  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    errors.push(`File too large. Maximum size is ${SECURITY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  // Check file type
  if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${SECURITY_CONFIG.ALLOWED_FILE_TYPES.join(', ')}`);
  }
  
  // Check filename for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // Script injection
    /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i, // Executable files
  ];
  
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(file.name)
  );
  
  if (hasSuspiciousPattern) {
    errors.push('Suspicious filename detected');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (length: number = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Hash sensitive data (simple implementation)
 */
export const hashSensitiveData = (data: string) => {
  let hash = 0;
  
  if (data.length === 0) {
    return hash.toString(16);
  }
  
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString(16);
};
