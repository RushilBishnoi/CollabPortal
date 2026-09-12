import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // 1. Prevent MIME-sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 2. Prevent Clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // 3. Strict Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 4. Permissions Policy (disable unnecessary hardware/browser APIs)
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    );

    // 5. Content Security Policy (Modern XSS Mitigation)
    // Structured to permit legitimate frontend assets, Tailwind inline styles, and Vite HMR in dev
    const isProd = process.env.NODE_ENV === 'production';
    const cspDirectives = [
      "default-src 'self'",
      "base-uri 'self'",
      "font-src 'self' https: data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: https:",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline'",
      isProd
        ? "connect-src 'self'"
        : "connect-src 'self' http://localhost:* ws://localhost:*",
    ].join('; ');

    res.setHeader('Content-Security-Policy', cspDirectives);

    // 6. HSTS (Strict-Transport-Security) in production
    if (isProd || req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    // 7. Remove identification headers
    res.removeHeader('X-Powered-By');

    next();
  }
}
