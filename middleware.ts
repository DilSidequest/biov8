import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

const isApiRoute = createRouteMatcher(['/api(.*)']);
const isOnboardingRoute = createRouteMatcher(['/onboarding']);
const isDoctorRoute = createRouteMatcher(['/doctor(.*)']);
const isNurseRoute = createRouteMatcher(['/nurse(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();

  // Allow public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Allow API routes to pass through (they handle their own auth)
  if (isApiRoute(request)) {
    return NextResponse.next();
  }

  // Redirect to sign-in if not authenticated
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Get user role from public metadata (available in session claims)
  const role = sessionClaims?.publicMetadata?.role as string | undefined;

  console.log('[Middleware] Path:', request.nextUrl.pathname, 'Role:', role, 'UserId:', userId);
  console.log('[Middleware] Session claims publicMetadata:', sessionClaims?.publicMetadata);

  // If has role and trying to access onboarding, redirect to appropriate dashboard
  if (role && isOnboardingRoute(request)) {
    const dashboardUrl = role === 'doctor' ? '/doctor' : '/nurse';
    console.log('[Middleware] Has role, redirecting from onboarding to:', dashboardUrl);
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // If no role and NOT on onboarding or dashboard pages, redirect to onboarding
  if (!role && !isOnboardingRoute(request) && !isDoctorRoute(request) && !isNurseRoute(request)) {
    console.log('[Middleware] No role found, redirecting to onboarding');
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Allow access to doctor/nurse routes even without role (for initial navigation after role selection)
  // The pages will handle the case where role isn't set yet
  if (isDoctorRoute(request)) {
    console.log('[Middleware] Accessing doctor route, role:', role);
  }

  if (isNurseRoute(request)) {
    console.log('[Middleware] Accessing nurse route, role:', role);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

