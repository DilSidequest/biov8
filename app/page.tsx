'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      // Not authenticated, redirect to sign-in
      router.push('/sign-in');
      return;
    }

    // Get user role from public metadata
    const role = user.publicMetadata?.role as string | undefined;

    if (!role) {
      // No role set, redirect to onboarding
      router.push('/onboarding');
    } else if (role === 'doctor') {
      // Doctor role, redirect to doctor dashboard
      router.push('/doctor');
    } else if (role === 'nurse') {
      // Nurse role, redirect to nurse dashboard
      router.push('/nurse');
    } else {
      // Unknown role, redirect to onboarding
      router.push('/onboarding');
    }
  }, [user, isLoaded, router]);

  // Show loading state while checking authentication
  return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

