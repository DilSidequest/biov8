import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body - includes full order data + doctor's additions
    const body = await request.json();
    const {
      orderId,
      orderNumber,
      customerName,
      customerEmail,
      totalAmount,
      currency,
      orderDate,
      lineItems,
      shippingAddress,
      tags,
      doctorName,
      clinicState,
      medicineName,
      medicineQuantity,
      medicineDescription,
      doctorNotes,
      signaturePdf,
      // Health Assessment fields
      healthChanges,
      takingMedications,
      hadMedicationBefore,
      pregnancyStatus,
      allergicReaction,
      allergies,
      medicalConditions
    } = body;

    console.log('Received submission request for order:', orderId, 'Order #:', orderNumber);

    // Validate required fields
    // Note: signaturePdf can be base64 encoded image (JPEG, PNG, GIF, WebP, SVG) or PDF
    if (!orderId || !customerEmail || !doctorNotes || !signaturePdf) {
      console.error('Missing required fields:', { orderId, customerEmail, hasNotes: !!doctorNotes, hasSignature: !!signaturePdf });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate doctor's notes length
    if (doctorNotes.length < 10) {
      console.error('Doctor notes too short:', doctorNotes.length);
      return NextResponse.json(
        { error: 'Doctor\'s notes must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Prepare webhook payload with complete order data + doctor's additions
    const webhookPayload = {
      // Original order data
      orderId,
      orderNumber,
      customerName,
      customerEmail,
      totalAmount,
      currency,
      orderDate,
      lineItems,
      shippingAddress,
      tags,
      // Doctor's additions
      doctorName,
      clinicState,
      medicineName,
      medicineQuantity,
      medicineDescription,
      doctorNotes,
      signaturePdf,
      // Health Assessment
      healthChanges,
      takingMedications,
      hadMedicationBefore,
      pregnancyStatus,
      allergicReaction,
      allergies,
      medicalConditions,
      // Submission metadata
      submittedAt: new Date().toISOString(),
    };

    // Get n8n webhook URL from environment
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    console.log('Webhook URL configured:', webhookUrl ? 'Yes' : 'No');
    console.log('Webhook URL:', webhookUrl);

    if (!webhookUrl) {
      console.error('N8N webhook URL not configured');
      return NextResponse.json(
        { error: 'Webhook URL not configured' },
        { status: 500 }
      );
    }

    console.log('Sending payload to n8n webhook...');
    console.log('Payload size:', JSON.stringify(webhookPayload).length, 'bytes');

    // Send to n8n webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('n8n webhook response status:', response.status);

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`n8n webhook failed with status ${response.status}:`, responseText);
        return NextResponse.json(
          { error: `Webhook failed with status ${response.status}`, details: responseText },
          { status: 500 }
        );
      }

      const responseData = await response.json().catch(() => ({}));
      console.log('n8n webhook response:', responseData);

      // Return success
      return NextResponse.json({
        success: true,
        message: 'Prescription form submitted successfully',
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        console.error('n8n webhook request timed out after 30 seconds');
        return NextResponse.json(
          { error: 'Webhook request timed out' },
          { status: 500 }
        );
      }

      throw fetchError;
    }

  } catch (error: any) {
    console.error('Failed to send to n8n:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Failed to submit to n8n', details: error.message },
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

