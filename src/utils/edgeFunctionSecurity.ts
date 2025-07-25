// Edge Function Security Utilities
export const createSecureCorsHeaders = (allowedOrigins?: string[]) => {
  const defaultAllowedOrigins = [
    'https://xefypnmvsikrdxzepgqf.supabase.co',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origins = allowedOrigins || defaultAllowedOrigins;
  
  return {
    'Access-Control-Allow-Origin': origins.join(', '),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Content-Security-Policy': "default-src 'self'; script-src 'none'; object-src 'none';",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
};

export const validateRequest = (request: Request): { isValid: boolean; error?: string } => {
  // Check for required headers
  const contentType = request.headers.get('content-type');
  
  if (request.method === 'POST' && !contentType?.includes('application/json')) {
    return { isValid: false, error: 'Invalid content type' };
  }
  
  // Check for potential attack patterns in headers
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /burp/i,
    /owasp/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return { isValid: false, error: 'Suspicious request detected' };
  }
  
  return { isValid: true };
};

export const rateLimitCheck = (
  identifier: string, 
  maxRequests: number = 60, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number } => {
  // This would ideally use a proper rate limiting service
  // For now, this is a simplified in-memory version
  const now = Date.now();
  const key = `rate_limit_${identifier}`;
  
  // In a real implementation, you'd use Redis or similar
  const requests = JSON.parse(globalThis[key as any] || '[]');
  const validRequests = requests.filter((time: number) => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  validRequests.push(now);
  globalThis[key as any] = JSON.stringify(validRequests);
  
  return { allowed: true, remaining: maxRequests - validRequests.length };
};

export const sanitizeRequestBody = (body: any): any => {
  if (typeof body !== 'object' || body === null) {
    return body;
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      // Remove potential XSS and injection patterns
      const cleaned = value
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
      
      sanitized[key] = cleaned;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestBody(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

export const createSecureResponse = (
  data: any, 
  status: number = 200,
  additionalHeaders?: Record<string, string>
): Response => {
  const headers = {
    ...createSecureCorsHeaders(),
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
};

export const handleSecureRequest = async (
  request: Request,
  handler: (request: Request, body?: any) => Promise<any>
): Promise<Response> => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      headers: createSecureCorsHeaders(),
      status: 200 
    });
  }
  
  // Validate request
  const validation = validateRequest(request);
  if (!validation.isValid) {
    return createSecureResponse(
      { error: validation.error }, 
      400
    );
  }
  
  try {
    let body = null;
    
    if (request.method === 'POST') {
      const rawBody = await request.json();
      body = sanitizeRequestBody(rawBody);
    }
    
    const result = await handler(request, body);
    return createSecureResponse(result);
    
  } catch (error) {
    console.error('Edge function error:', error);
    
    // Don't expose internal errors to clients
    return createSecureResponse(
      { error: 'Internal server error' }, 
      500
    );
  }
};