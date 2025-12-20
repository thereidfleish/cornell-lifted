import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Only intercept API responses
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Let the API route run, but if it returns an error, redirect to /error
    // (This is not possible in middleware, but we can handle SSR errors here if needed)
    return NextResponse.next();
  }
  return NextResponse.next();
}

// Optionally, specify matcher to run on all routes
export const config = {
  matcher: '/((?!_next|static|favicon.ico).*)',
};
