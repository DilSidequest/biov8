import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { orderId, customerEmail, doctorNotes, signaturePdf } = body;

    // Validate required fields
    if (!orderId || !customerEmail || !doctorNotes || !signaturePdf) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate doctor's notes length
    if (doctorNotes.length < 10) {
      return NextResponse.json(
        { error: 'Doctor\'s notes must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Prepare webhook payload
    const webhookPayload = {
      orderId,
      customerEmail,
      doctorNotes,
      signaturePdf,
      submittedAt: new Date().toISOString(),
    };

    // Get n8n webhook URL from environment
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('N8N webhook URL not configured');
      return NextResponse.json(
        { error: 'Webhook URL not configured' },
        { status: 500 }
      );
    }

    // Send to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      console.error(`n8n webhook failed: ${response.status}`);
      throw new Error(`n8n webhook failed: ${response.status}`);
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Prescription form submitted successfully',
    });

  } catch (error) {
    console.error('Failed to send to n8n:', error);
    return NextResponse.json(
      { error: 'Failed to submit to n8n' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

