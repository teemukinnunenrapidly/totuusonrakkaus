/**
 * Input sanitization utilities for security
 */

// DOMPurify-like sanitization for text content
export const sanitizeText = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  // Poista HTML-tagit
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Poista JavaScript-koodi
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Poista SQL injection patterns
  const sqlPatterns = [
    /union\s+select/gi,
    /drop\s+table/gi,
    /insert\s+into/gi,
    /delete\s+from/gi,
    /update\s+set/gi,
    /alter\s+table/gi,
    /create\s+table/gi,
    /exec\s*\(/gi,
    /xp_cmdshell/gi
  ];
  
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Poista command injection patterns
  const commandPatterns = [
    /[;&|`$]/g, // Shell command separators
    /\.\.\//g,   // Directory traversal
    /\/etc\/passwd/gi,
    /\/proc\//gi
  ];
  
  commandPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Rajoita pituus
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized;
};

// Email validation and sanitization
export const sanitizeEmail = (email: string): string | null => {
  if (typeof email !== 'string') {
    return null;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.toLowerCase().trim();
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  // Estä epäilyttäviä email-osoitteita
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i
  ];
  
  const containsSuspicious = suspiciousPatterns.some(pattern => pattern.test(sanitized));
  if (containsSuspicious) {
    return null;
  }
  
  return sanitized;
};

// UUID validation
export const validateUUID = (uuid: string): boolean => {
  if (typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// HTML content sanitization (basic)
export const sanitizeHTML = (html: string): string => {
  if (typeof html !== 'string') {
    return '';
  }
  
  // Salli vain turvalliset HTML-tagit
  const allowedTags = [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
  ];
  
  const allowedAttributes = [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target'
  ];
  
  // Poista kaikki script-tagit ja event handlers
  let sanitized = html.replace(/<script[^>]*>.*?<\/script>/gis, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Poista epäilyttävät attribuutit
  sanitized = sanitized.replace(/\s+style\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Rajoita pituus
  if (sanitized.length > 50000) {
    sanitized = sanitized.substring(0, 50000);
  }
  
  return sanitized;
};

// URL validation and sanitization
export const sanitizeURL = (url: string): string | null => {
  if (typeof url !== 'string') {
    return null;
  }
  
  const sanitized = url.trim();
  
  // Tarkista että URL on turvallinen
  try {
    const urlObj = new URL(sanitized);
    
    // Salli vain HTTPS ja HTTP
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    // Estä data: ja javascript: URL:t
    if (urlObj.protocol === 'data:' || urlObj.protocol === 'javascript:') {
      return null;
    }
    
    // Tarkista että domain on turvallinen
    const allowedDomains = [
      'vimeo.com',
      'player.vimeo.com',
      'youtube.com',
      'youtu.be',
      'supabase.co',
      'totuusonrakkaus.fi'
    ];
    
    const domain = urlObj.hostname.toLowerCase();
    const isAllowed = allowedDomains.some(allowed => 
      domain === allowed || domain.endsWith('.' + allowed)
    );
    
    if (!isAllowed) {
      return null;
    }
    
    return sanitized;
  } catch {
    return null;
  }
};

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (typeof password !== 'string') {
    return { isValid: false, errors: ['Salasanan pitää olla merkkijono'] };
  }
  
  if (password.length < 8) {
    errors.push('Salasanan pitää olla vähintään 8 merkkiä pitkä');
  }
  
  if (password.length > 128) {
    errors.push('Salasanan pitää olla enintään 128 merkkiä pitkä');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Salasanan pitää sisältää vähintään yhden pienen kirjaimen');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Salasanan pitää sisältää vähintään yhden ison kirjaimen');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Salasanan pitää sisältää vähintään yhden numeron');
  }
  
  // Estä yleisiä salasanoja
  const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'letmein',
    'salasana', 'password123', 'admin123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Salasana on liian yleinen');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Input length validation
export const validateInputLength = (
  input: string, 
  minLength: number = 1, 
  maxLength: number = 1000
): boolean => {
  if (typeof input !== 'string') {
    return false;
  }
  
  const length = input.trim().length;
  return length >= minLength && length <= maxLength;
};

// Sanitize object properties recursively
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};
