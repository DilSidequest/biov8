'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user already has a role and redirect
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const existingRole = user.publicMetadata?.role as string | undefined;
      console.log('Onboarding: Checking existing role:', existingRole);

      if (existingRole === 'doctor') {
        console.log('User already has doctor role, redirecting...');
        router.push('/doctor');
      } else if (existingRole === 'nurse') {
        console.log('User already has nurse role, redirecting...');
        router.push('/nurse');
      }
    }
  }, [user, isLoaded, router]);

  const handleRoleSelection = async (role: 'doctor' | 'nurse') => {
    if (!user) {
      console.error('No user found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Current publicMetadata before update:', user.publicMetadata);
      console.log('Setting role to:', role);

      // Call server-side API to update user publicMetadata
      const response = await fetch('/api/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set role');
      }

      const data = await response.json();
      console.log('Role updated successfully:', data);

      // Reload the user to get updated metadata
      await user.reload();
      console.log('publicMetadata after update:', user.publicMetadata);

      // Navigate directly to the dashboard
      const dashboardUrl = role === 'doctor' ? '/doctor' : '/nurse';
      console.log('Navigating to:', dashboardUrl);

      // Use window.location.href for a hard navigation to ensure session is refreshed
      window.location.href = dashboardUrl;

    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to set role. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to Medical Portal</h1>
          <p className="text-slate-400 text-lg">Please select your role to continue</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Doctor Card */}
          <button
            onClick={() => handleRoleSelection('doctor')}
            disabled={isLoading}
            className="group relative bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-blue-500 rounded-xl p-8 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="mb-4 text-6xl">👨‍⚕️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Doctor</h2>
              <p className="text-slate-400">
                Access the full prescription management system
              </p>
            </div>
            <div className="absolute inset-0 bg-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* Nurse Card */}
          <button
            onClick={() => handleRoleSelection('nurse')}
            disabled={isLoading}
            className="group relative bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-green-500 rounded-xl p-8 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="mb-4 text-6xl">👩‍⚕️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Nurse</h2>
              <p className="text-slate-400">
                Access the nurse dashboard and patient care tools
              </p>
            </div>
            <div className="absolute inset-0 bg-green-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {isLoading && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-slate-400 mt-2">Setting up your account...</p>
          </div>
        )}
      </div>
    </div>
  );
}

