/**
 * Input sanitization and validation utilities
 */

// HTML sanitization allowed tags and attributes
const ALLOWED_HTML_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const ALLOWED_HTML_ATTRIBUTES = ['class', 'id'];

/**
 * Sanitize text input by removing potentially dangerous characters
 */
export const sanitizeText = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

/**
 * Sanitize and validate email address
 */
export const sanitizeEmail = (email: string): string | null => {
  if (typeof email !== 'string') {
    return null;
  }
  
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
};

/**
 * Validate UUID format
 */
export const validateUUID = (uuid: string): boolean => {
  if (typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Sanitize HTML content
 */
export const sanitizeHTML = (html: string): string => {
  if (typeof html !== 'string') {
    return '';
  }
  
  // Simple HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .substring(0, 5000); // Limit length
};

/**
 * Sanitize and validate URL
 */
export const sanitizeURL = (url: string): string | null => {
  if (typeof url !== 'string') {
    return null;
  }
  
  const sanitized = url.trim();
  
  // Check if it's a valid URL
  try {
    const urlObj = new URL(sanitized);
    const allowedProtocols = ['http:', 'https:'];
    
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return null;
    }
    
    return sanitized;
  } catch {
    return null;
  }
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (typeof password !== 'string') {
    return { isValid: false, errors: ['Salasana on pakollinen'] };
  }
  
  if (password.length < 8) {
    errors.push('Salasanan tulee olla vähintään 8 merkkiä pitkä');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Salasanan tulee sisältää vähintään yksi iso kirjain');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Salasanan tulee sisältää vähintään yksi pieni kirjain');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Salasanan tulee sisältää vähintään yksi numero');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate input length
 */
export const validateInputLength = (input: string, minLength: number = 1, maxLength: number = 1000): boolean => {
  if (typeof input !== 'string') {
    return false;
  }
  
  const length = input.trim().length;
  return length >= minLength && length <= maxLength;
};

/**
 * Sanitize object properties
 */
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeText(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value as Record<string, unknown>) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }
  
  return sanitized;
};
