import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user's ID
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || (role !== 'doctor' && role !== 'nurse')) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "doctor" or "nurse"' },
        { status: 400 }
      );
    }

    console.log(`[set-role] Setting role for user ${userId} to ${role}`);

    // Update user's public metadata using Clerk's server-side API
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role,
      },
    });

    console.log(`[set-role] Role updated successfully for user ${userId}`);

    return NextResponse.json({
      success: true,
      role: role,
    });

  } catch (error: any) {
    console.error('[set-role] Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role', details: error.message },
      { status: 500 }
    );
  }
}

