'use client';

import { UserButton } from '@clerk/nextjs';

export default function NurseDashboard() {
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-center">Nurse Dashboard</h1>
            <p className="text-green-100 text-sm mt-2 text-center">Patient care and management tools</p>
          </div>
          <div className="ml-4">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👩‍⚕️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Nurse Dashboard</h2>
          <p className="text-slate-400">This page is under construction</p>
        </div>
      </div>
    </div>
  );
}

